import json
import os


_REVIEW_PROMPT_TEMPLATE = """Kamu adalah auditor dokumen profesional di perusahaan Indonesia. Tugasmu mereview teks dokumen dan menemukan masalah SPESIFIK — bukan komentar generik.

Dokumen bisa berupa apa saja: kontrak kerja, MoU, PKS, surat keputusan, surat permohonan, project charter, berita acara, notulen rapat, laporan, SPK, PO, NDA, dll. Sesuaikan kriteria review dengan jenis dokumennya.

TEKS DOKUMEN:
{text}

Berikan output HANYA dalam format JSON berikut (tanpa markdown code block, tanpa komentar, langsung JSON):
{{
  "summary": "Sebutkan jenis dokumen, pihak-pihak yang terlibat, dan tujuan utamanya dalam 2-3 kalimat.",
  "items": [
    {{
      "level": "critical",
      "category": "Nama kategori singkat (mis: 'Nomor Dokumen', 'Tanggal', 'Pihak', 'Scope', 'Milestone', 'Risk', 'Lampiran')",
      "title": "Ringkasan singkat temuan (max 60 karakter, seperti headline)",
      "text": "Penjelasan detail masalah dan dampaknya",
      "evidence": {{
        "page": 1,
        "quote": "Kutipan TEPAT dari dokumen yang bermasalah (max 200 karakter)"
      }},
      "cta": "Action label singkat (mis: 'Perbaiki nomor', 'Tambahkan tanggal', 'Konfirmasi ke PIC')"
    }}
  ],
  "recommendation": "Rekomendasi tindak lanjut yang jelas dan actionable sesuai jenis dokumen."
}}

Panduan level:
- "critical": nomor/kode dokumen kosong, nama pihak typo/duplikat (mis: "PT. PT. X"), tanggal kosong/tidak konsisten, kolom mandatory kosong, nilai kontrak tidak disebutkan, tidak ada pasal sengketa (untuk kontrak), tidak ada tanda tangan/pihak berwenang
- "warning": scope tidak terukur, deliverable tanpa kriteria selesai, jangka waktu samar, asumsi/risiko tanpa owner, klausul multitafsir, tidak ada mekanisme perpanjangan/terminasi, milestone tidak konkret
- "minor": format tanggal tidak konsisten, referensi lampiran tidak ada, bagian opsional belum diisi, keterangan jabatan tidak lengkap, singkatan tidak dijelaskan

WAJIB: Tiap item punya "evidence" dengan kutipan TEPAT dari dokumen (copy-paste, jangan parafrase). Kalau field yang bermasalah kosong, quote-nya sebutkan label field + "(kosong)".

Temukan masalah NYATA dari teks. Minimal 3 item, maksimal 12 item."""


def _build_prompt(text: str) -> str:
    return _REVIEW_PROMPT_TEMPLATE.format(text=text[:8000])


def _db_setting(db, key: str, default: str = "") -> str:
    if db is None:
        return default
    try:
        from sqlalchemy import select
        from app.models.app_setting import AppSetting
        row = db.scalar(select(AppSetting).where(AppSetting.key == key))
        return (row.value or "").strip() if row and row.value else default
    except Exception:
        return default


async def review_document_text(text: str, db=None) -> dict:
    if not text.strip():
        return {
            "summary": "Teks tidak dapat diekstrak dari dokumen ini. Dokumen mungkin berupa scan/image tanpa teks selectable.",
            "points": [
                {"level": "critical", "text": "Dokumen tidak memiliki teks selectable — kemungkinan berupa scan/gambar."},
                {"level": "warning", "text": "Pertimbangkan OCR sebelum proses review agar analisis bisa dilakukan."},
            ],
            "notes": [],
            "recommendation": "Harap unggah dokumen dengan teks yang dapat dibaca secara digital (bukan scan).",
            "reviewed_by_system": "LontaraAI Review v1.0",
        }

    # DB settings override env vars
    api_key = _db_setting(db, "llm_api_key") or os.getenv("AI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_") or api_key.endswith("_here"):
        return _placeholder_review(text)

    provider_env = _db_setting(db, "llm_provider") or os.getenv("AI_PROVIDER", "").strip().lower()
    is_openrouter = api_key.startswith("sk-or-") or provider_env == "openrouter"
    model = _db_setting(db, "llm_model") or os.getenv("AI_MODEL", "").strip() or (
        "anthropic/claude-sonnet-4.5" if is_openrouter else "claude-sonnet-4-6"
    )

    try:
        if is_openrouter:
            # OpenRouter: OpenAI-compatible chat completions endpoint.
            import httpx
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://lontarasign.local",
                "X-Title": "LontaraSign",
            }
            payload = {
                "model": model,
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": _build_prompt(text)}],
            }
            async with httpx.AsyncClient(timeout=150) as ac:
                resp = await ac.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers, json=payload,
                )
                resp.raise_for_status()
                body = resp.json()
            msg = body.get("choices", [{}])[0].get("message", {}) or {}
            # Beberapa reasoning model menaruh hasil di "reasoning" bukan "content".
            raw = (msg.get("content") or msg.get("reasoning") or "").strip()
            if not raw:
                raise RuntimeError(f"empty AI response: {str(body)[:300]}")
            reviewed_by = f"LontaraAI Review v1.0 ({model})"
        else:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            message = client.messages.create(
                model=model,
                max_tokens=2048,
                messages=[{"role": "user", "content": _build_prompt(text)}],
            )
            raw = message.content[0].text.strip()
            reviewed_by = f"LontaraAI Review v1.0 ({model})"

        # Strip markdown code fence
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        # Cari JSON object terbesar dalam respons (kalau model preface dengan teks)
        if not raw.startswith("{"):
            import re as _re
            m = _re.search(r"\{[\s\S]*\}", raw)
            if m:
                raw = m.group(0)

        data = json.loads(raw)
        items = data.get("items", [])
        normalised = []
        for item in items:
            if isinstance(item, str):
                normalised.append({"level": "warning", "text": item, "category": "", "title": item[:60], "evidence": None, "cta": ""})
            elif isinstance(item, dict):
                ev = item.get("evidence") or None
                if isinstance(ev, dict):
                    ev = {"page": ev.get("page", 1), "quote": str(ev.get("quote", ""))[:400]}
                normalised.append({
                    "level": item.get("level", "warning"),
                    "category": str(item.get("category", ""))[:40],
                    "title": str(item.get("title") or item.get("text", ""))[:120],
                    "text": str(item.get("text", "")),
                    "evidence": ev,
                    "cta": str(item.get("cta", ""))[:40],
                })

        return {
            "summary": data.get("summary", ""),
            "points": normalised,
            "notes": [],
            "recommendation": data.get("recommendation", ""),
            "reviewed_by_system": reviewed_by,
        }

    except Exception as exc:
        return _placeholder_review(text, error=str(exc))


def _placeholder_review(text: str, error: str = "") -> dict:
    word_count = len(text.split())
    # Extract kode HTTP kalau ada (402, 429, dll) untuk pesan ringkas
    short_err = ""
    if error:
        import re as _re
        m = _re.search(r"'(\d{3}) ([^']+)'", error) or _re.search(r"(\d{3})\s", error)
        short_err = f" [{m.group(1)}]" if m else f" [err]"
    # VARCHAR(150) limit — pakai suffix pendek saja
    reviewed_by = ("LontaraAI Review v1.0 (placeholder)" + short_err)[:145]
    return {
        "summary": (
            f"Dokumen berhasil diekstrak ({word_count} kata). "
            "AI review tidak tersedia — konfigurasi AI_API_KEY diperlukan."
            + (f"\n\nError: {error[:500]}" if error else "")
        ),
        "points": [
            {"level": "warning", "text": "AI review tidak aktif. Tambahkan AI_API_KEY yang valid di file .env lalu restart backend."},
            {"level": "minor", "text": f"Total {word_count} kata berhasil diekstrak dari dokumen."},
            *([{"level": "critical", "text": f"Detail error dari AI provider: {error[:300]}"}] if error else []),
        ],
        "notes": [],
        "recommendation": "Lakukan verifikasi manual sebelum menandatangani dokumen, atau cek konfigurasi AI_API_KEY / saldo kredit di provider.",
        "reviewed_by_system": reviewed_by,
    }
