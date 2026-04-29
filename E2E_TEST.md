# LontaraSign — E2E Test Report

**Tanggal:** 29 April 2026
**Target:** Lokal stack (`http://localhost:8000` backend, `http://localhost:5173` frontend)
**Script:** [`D:/project/lontarasign-ops/e2e_full.py`](../lontarasign-ops/e2e_full.py)
**Hasil:** **28/28 PASS** ✅

---

## Phase 1 — Registrasi user + aktivasi admin + login

| Step | Aulia Sari | Bayu Pratama |
|---|---|---|
| 1. POST `/auth/register` | ✅ `pending=True` | ✅ `pending=True` |
| 2. Login sebelum aktivasi (expect 403) | ✅ "belum diaktifkan" | ✅ "belum diaktifkan" |
| 3. Admin lihat user pending di `/admin/users` | ✅ visible | ✅ visible |
| 4. Admin PATCH `is_active=true` | ✅ approved | ✅ approved |
| 5. Login setelah aktivasi (expect 200) | ✅ token issued | ✅ token issued |

**Insight:**
- Registrasi langsung dibuat `is_active=False` di backend → user tidak bisa login.
- Admin (org-scoped + global pending) bisa lihat user pending di tab Pengguna (badge "2" muncul).
- Aktivasi via `PATCH /admin/users/{id}` tidak ada audit log dedicated (hanya entry generic — flagged di security audit).

---

## Phase 2 — Upload + AI review + sign + share (per user)

Sample dokumen: `LS-2026-04-23-285087_draft_memo_kerja_sama_vendor.pdf` (2 copies, 1 untuk tiap user).

| Step | Doc Aulia (LS-2026-04-29-593570) | Doc Bayu (LS-2026-04-29-499254) |
|---|---|---|
| 1. POST `/documents/upload` | ✅ doc_id=13 | ✅ doc_id=14 |
| 2. POST `/documents/{id}/review` (AI) | ✅ 200 (placeholder fallback*) | ✅ 200 (placeholder fallback*) |
| 3. POST `/documents/{id}/approve` | ✅ status=`pending_sign` | ✅ status=`pending_sign` |
| 4. POST `/signature/draw` (PNG) | ✅ saved | ✅ saved |
| 5. POST `/sign-finalize` (embed) | ✅ status=`signed` | ✅ status=`signed` |
| 6. GET `/download-signed` | ✅ 1818 bytes PDF | ✅ 1818 bytes PDF |
| 7. POST `/{id}/share` | ✅ token + verify_url | ✅ token + verify_url |
| 8. Public access verify_url (no auth) | ✅ 200 JSON | ✅ 200 JSON |

\* AI review fallback ke placeholder karena `.env` lokal masih pakai model OpenRouter `inclusionai/ling-2.6-flash:free` yang sudah dead. Endpoint tidak crash — fallback graceful. Prod sudah pakai `inclusionai/ling-2.6-1t:free` via DB setting & jalan normal.

---

## Security Audit (otomatis — OWASP Top 10)

13 finding total — **2 CRITICAL, 3 HIGH, 5 MEDIUM, 3 LOW**.

### 🔴 CRITICAL

1. **Token tidak punya expiration** — `app/core/security.py issue_token()` tidak set TTL. Token dicuri = perpetual access. **Fix:** tambah kolom `expires_at` di `user_tokens`, default 7 hari.
2. **Org-scoped access bypass** — `_get_owned_doc()` di [`signature.py:186-196`](backend/app/api/signature.py#L186), [`review.py:149-159`](backend/app/api/review.py#L149) izinkan SEMUA user di org sama akses dokumen orang lain (termasuk tanda tangani / mark revisi). **Fix:** explicit owner check, atau buat tabel delegation.

### 🟠 HIGH

3. **LLM API key plaintext di DB** — [`admin.py:227`](backend/app/api/admin.py#L227) write `str(v)` mentah ke `app_settings`. DB breach = LLM key compromise. **Fix:** encrypt-at-rest pakai `cryptography.Fernet`, decrypt only saat dipanggil di `ai_review.py`.
4. **Verify endpoint tanpa share token check** — [`verify.py:14-37`](backend/app/api/verify.py#L14) hanya butuh `doc_id`. Attacker bisa enumerate doc_id → akses signed PDF tanpa token. **Fix:** wajibkan `?token=xxx`, validate hash di DB.

### 🟡 MEDIUM (5)
- Weak file upload validation (image content-type spoofable, no magic bytes for PNG/JPG).
- Admin approval tidak punya audit log dedicated WHO+KAPAN.
- Rate limiting cuma di register/login — endpoint review/sign/upload tidak ada limit.
- Frontend simpan token di localStorage (XSS risk). Pertimbangkan httpOnly cookie.
- `SECRET_KEY` di-regenerate per restart kalau env kosong → semua token lama invalid.

### 🟢 LOW (3)
- Error message `/auth/login` sudah generic ✅; tapi error AI service kadang leak full traceback.
- `PATCH /admin/settings` accept arbitrary dict (filter ada tapi pakai Pydantic schema lebih aman).
- HTTP-only di prod (no HTTPS) — token transit cleartext.

---

## Code Review (otomatis — quality/maintainability)

### TOP 5 PRIORITY

1. **`error_response()` dipanggil dengan `return`** — fungsi ini `raise HTTPException`, tapi banyak call-site `return error_response(...)`. Karena raise, code setelahnya tidak execute. Tidak ada bug aktif sekarang, tapi confusing & bisa muncul double-response kalau exception handler diubah. **Fix:** drop `return` di semua call-site (review.py, signature.py, auth.py, dll), atau ubah `error_response()` jadi return saja tanpa raise.
2. **N+1 queries di admin** — [`admin.py:73`](backend/app/api/admin.py#L73) load semua docs lalu count per user di Python; [`admin.py:122`](backend/app/api/admin.py#L122) load semua users. Untuk 1000 docs = lambat. **Fix:** `SELECT uploaded_by, COUNT(*) GROUP BY uploaded_by` + JOIN.
3. **Race condition di `trigger_review()` upsert** — ada try/except IntegrityError, tapi window race masih terbuka. **Fix:** single `if existing: update else: insert` dalam satu transaction.
4. **Async hygiene** — `upload_document()`, `trigger_review()` marked `async` tapi DB call sync. Tidak ada bug, hanya tidak nyokong concurrency. **Fix:** biarkan async untuk file/HTTP I/O, jangan sync DB di async, atau migrasi `AsyncSession` (besar).
5. **AdminPage.jsx 567 LOC** — semua tab dalam 1 file. **Fix:** split jadi `AdminStats.jsx`, `AdminDocs.jsx`, `AdminUsers.jsx`, `AdminSettings.jsx`.

### NICE-TO-HAVE
- Magic numbers `(380, 120, 150, 60)` posisi default signature → pindah ke `constants.py`.
- Status enum hardcoded di frontend ↔ backend Enum SQLAlchemy → satu source of truth.
- Tidak ada folder `tests/` — minimal coverage untuk endpoint kritikal.
- Schema migration pakai `create_all()` + manual ALTER — pertimbangkan Alembic.
- DocumentLog tidak simpan IP address / user-agent (audit trail untuk fraud).

---

## Aksi yang Direkomendasikan

**Tier 1 — Security blocker (bertahap dalam 1-2 minggu):**
- [ ] Token expiration (CRITICAL #1)
- [ ] Verify endpoint butuh share token (HIGH #4)
- [ ] Encrypt LLM API key di DB (HIGH #3)
- [ ] Owner check eksplisit di sign-finalize (CRITICAL #2 — atau dokumentasikan bahwa org-scope adalah desain disengaja)

**Tier 2 — Code quality (di sprint berikutnya):**
- [ ] Drop `return` dari `error_response()` calls
- [ ] Refactor N+1 di admin endpoints
- [ ] Split AdminPage.jsx

**Tier 3 — Hardening (saat ada bandwidth):**
- [ ] Rate limit di review/sign/upload
- [ ] Migrasi token ke httpOnly cookie
- [ ] HTTPS di prod (perlu domain + Caddy auto-cert)
- [ ] Alembic untuk schema migration
- [ ] Setup tests folder

---

## Lampiran

- Sample sigature PNG dibuat in-script (200×80 RGBA, diagonal stroke transparent bg) — verifies signature transparency fix berhasil.
- Hasil JSON detail: `D:/project/lontarasign-ops/e2e_results.json`
- Test re-runnable: `python D:/project/lontarasign-ops/e2e_full.py` (ulang akan buat user+doc baru, tidak konflik).
