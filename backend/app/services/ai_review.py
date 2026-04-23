"""
Placeholder AI review service.
Swap the body of `review_document_text` with a real LLM API call (OpenAI, Anthropic, etc.)
when ready. The return shape must stay the same so callers don't change.
"""


async def review_document_text(text: str) -> dict:
    if not text.strip():
        return {
            "summary": "Teks tidak dapat diekstrak dari dokumen ini. Dokumen mungkin berupa scan/image tanpa teks selectable.",
            "points": [],
            "notes": [
                "Pastikan dokumen berformat teks selectable (bukan scan gambar).",
                "Pertimbangkan untuk menggunakan OCR sebelum proses review.",
            ],
            "recommendation": "Harap unggah dokumen dengan teks yang dapat dibaca secara digital.",
            "reviewed_by_system": "LontaraAI Review v0.1 (placeholder)",
        }

    word_count = len(text.split())
    return {
        "summary": (
            f"Dokumen telah dianalisis oleh LontaraAI Review. "
            f"Teks berhasil diekstrak ({word_count} kata). "
            "Secara umum struktur dokumen sudah terbaca dengan baik dan siap untuk ditinjau lebih lanjut."
        ),
        "points": [
            "Struktur dan format dokumen sudah terbaca dengan baik",
            "Konten utama dokumen dapat diidentifikasi",
            "Terdapat beberapa bagian yang perlu verifikasi manual",
            f"Total {word_count} kata berhasil diekstrak dari dokumen",
        ],
        "notes": [
            "Review ini bersifat otomatis — perlu validasi oleh pihak yang berwenang",
            "Pastikan semua data dan angka sudah sesuai sebelum penandatanganan",
            "Periksa kembali identitas pihak-pihak yang disebutkan dalam dokumen",
        ],
        "recommendation": (
            "Dokumen dapat dilanjutkan ke tahap penandatanganan setelah "
            "verifikasi manual oleh pihak yang berwenang. "
            "Pastikan semua klausul dan ketentuan telah disetujui semua pihak."
        ),
        "reviewed_by_system": "LontaraAI Review v0.1 (placeholder)",
    }
