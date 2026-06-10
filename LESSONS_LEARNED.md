# Lessons Learned

Dokumentasi otomatis masalah teknis dan solusinya.

---

## [2026-05-26] Issue: nginx proxy_pass pakai container name, bukan service name

**Context:** Deploy LontaraSign ke server PMD Kalla (10.11.3.190). API 502 Bad Gateway setelah containers UP.  
**Problem:** `nginx.conf` menggunakan `http://lontarasign_backend:8000` sebagai proxy_pass, hasilnya 502.  
**Root Cause:** Docker Compose DNS resolution menggunakan **service name** (di `docker-compose.yml`), bukan container name. Container name `lontarasign_backend` hanya untuk `docker` CLI, tidak bisa di-resolve antar container.  
**Fix:** Ganti `proxy_pass http://lontarasign_backend:8000` → `proxy_pass http://backend:8000`. Rebuild image agar fix permanen.  
**Tags:** #docker #nginx #dns #proxy

---

## [2026-05-26] Issue: Password dengan `@` merusak DB connection URL

**Context:** Backend FastAPI crash setelah container MySQL healthy.  
**Problem:** Password `LontaraUser@PMD2026!` menyebabkan SQLAlchemy gagal parse DATABASE_URL. Error: host `PMD2026!@mysql` not found.  
**Root Cause:** SQLAlchemy membangun URL dari env vars: `mysql://user:password@host`. Karakter `@` dalam password diinterpretasikan sebagai pemisah host — sehingga `PMD2026!` dianggap bagian dari password dan `mysql` hilang dari hostname.  
**Fix:** Ganti password agar tidak mengandung `@` atau `:`. Gunakan `.` sebagai separator: `LontaraUser.PMD2026`.  
**Tags:** #fastapi #sqlalchemy #mysql #password #url-encoding

---

## [2026-05-26] Issue: tsh CLI login gagal meski password benar

**Context:** Deploy file via `tsh scp` ke server Teleport PMD Kalla.  
**Problem:** `tsh login` error "invalid credentials" padahal password sama dengan yang dipakai di Teleport web browser.  
**Root Cause:** Belum diketahui pasti — kemungkinan tsh CLI membutuhkan setup MFA berbeda atau ada issue dengan versi tsh vs Teleport server.  
**Fix:** Gunakan Teleport **web terminal** (browser) sebagai alternatif. Upload file via tombol "Upload Files" di web terminal. Buat tar.gz lokal, upload, lalu extract di server.  
**Tags:** #teleport #ssh #tsh #file-transfer

---

## [2026-05-26] Issue: Fix nginx hilang setelah `docker compose down -v && up -d`

**Context:** Setelah fix password DB, perlu recreate container dengan `down -v` untuk reset volume MySQL.  
**Problem:** Fix nginx yang sudah diterapkan via `sed` di running container hilang karena container dibuat ulang dari image lama.  
**Root Cause:** `sed` hanya memodifikasi filesystem container yang sedang berjalan — tidak mengubah Docker image. Saat container recreate, image lama dipakai kembali.  
**Fix:** Setelah fix file source di server, wajib `docker compose build <service>` untuk bake perubahan ke image, lalu `up -d --no-deps <service>`.  
**Tags:** #docker #nginx #image-rebuild #container

---

## [2026-05-28] Issue: Teleport SCP download selalu 404

**Context:** Mencoba download file status dari server via Teleport web terminal "Download Files" button.
**Problem:** SCP endpoint `/v1/webapi/sites/.../scp` selalu return 404, baik path `/tmp/r.txt` maupun `~/r.txt`.
**Root Cause:** Kemungkinan Teleport v18 di setup ini tidak mengaktifkan SCP file transfer, atau moderasi session memblokir transfer. Upload bekerja tapi download tidak.
**Fix:** Alternatif: baca file via `cat` di terminal + zoom screenshot, atau serve file via HTTP sementara (`python3 -m http.server`).
**Tags:** #teleport #scp #file-transfer

---

## [2026-05-28] Issue: PATH tidak include /usr/sbin setelah sudo apt install nginx

**Context:** Install nginx via `apt-get install -y nginx`, lalu coba jalankan `nginx -v`.
**Problem:** `nginx: command not found` karena `/usr/sbin` tidak ada di PATH user `pm-budirman`.
**Root Cause:** User non-root di Ubuntu tidak memiliki `/usr/sbin:/sbin` di PATH secara default.
**Fix:** Gunakan full path: `sudo /usr/sbin/nginx -t`, `sudo /usr/sbin/nginx -v`. Atau tambahkan ke PATH di `.bashrc`: `export PATH=$PATH:/usr/sbin`.
**Tags:** #nginx #ubuntu #path #sudo

---

## [2026-06-03] Issue: VITE_API_BASE_URL hardcoded localhost:8000 → Failed to fetch di production

**Context:** Frontend live di http://10.11.3.190, login form "Failed to fetch" walau backend API 200 via curl.
**Problem:** Browser memanggil `http://localhost:8000/api/v1/auth/login` (ERR_CONNECTION_REFUSED), bukan `/api/v1` relative.
**Root Cause:** `frontend/.env` punya `VITE_API_BASE_URL=http://localhost:8000/api/v1` — ter-baked ke bundle saat `npm run build`. Vite env di-inline saat build, bukan runtime.
**Fix:** Kosongkan `VITE_API_BASE_URL=` (api.js fallback ke `/api/v1` relative → nginx proxy ke backend). Rebuild frontend image. Hard refresh browser (Ctrl+Shift+R) karena bundle lama di-cache.
**Tags:** #vite #react #docker #env #nginx

## [2026-06-04] Issue: AI review 401/429 — OpenRouter key expired & free model rate-limited

**Context:** AI review dokumen gagal: "401 Unauthorized" dari openrouter.ai.
**Problem:** Key lama expired (401). Setelah ganti ke key free-tier, model `:free` (gpt-oss-20b:free dst) sering 429 "temporarily rate-limited upstream".
**Root Cause:** Free-tier model di OpenRouter dishare banyak user → rate-limit upstream tidak predictable untuk produksi.
**Fix:** Pakai token paid + model paid `openai/gpt-oss-120b` (~$0.000016/request, no 429). Cek validitas key via `GET /api/v1/auth/key`, list model via `GET /api/v1/models` filter `:free`.
**Tags:** #openrouter #ai #rate-limit #production

## [2026-06-04] Issue: signed_at tampil UTC bukan WITA di footer PDF

**Context:** Footer sertifikat PDF tampilkan jam 00:58 padahal harusnya 08:58 WITA.
**Problem:** `signed_at` disimpan naive UTC (`datetime.utcnow()`), ditampilkan apa adanya tanpa konversi timezone.
**Root Cause:** Backend simpan UTC, layer presentasi tidak konversi ke WITA (UTC+8).
**Fix:** Helper `_to_wita(dt)` di certificate_service.py: assume naive=UTC, `.astimezone(timezone(timedelta(hours=8)))`.
**Tags:** #timezone #datetime #python #pdf

## [2026-06-04] Issue: PyMuPDF draw_rect radius & fill_textbox API quirks

**Context:** Generate sertifikat PDF dengan PyMuPDF (fitz) 1.24.3.
**Problem:** (1) `draw_rect(radius=6)` → "bad radius value 6" (radius itu fraksi 0-1, bukan pixel). (2) `fill_textbox(color=...)` → unexpected kwarg. (3) `doc.save(path)` ke file yang sedang dibuka → "save to original must be incremental".
**Root Cause:** API PyMuPDF: radius = fraksi dari sisi terpendek (0.0-1.0); TextWriter.fill_textbox tidak terima color (set saat write_text); tidak bisa save non-incremental ke path sumber.
**Fix:** radius=0.01; pakai insert_text biasa untuk teks; save ke `path.tmp` lalu `shutil.move`.
**Tags:** #pymupdf #pdf #python

## [2026-06-10] Issue: AI review false-positive "tidak ada tanda tangan" pada dokumen scan/TTD
**Context:** User upload BAST-TTD.pdf (sudah ditandatangani), AI review flag 2 critical palsu: "Tanda tangan tidak ada" & "Nomor dokumen terpotong (058/HK-)".
**Problem:** AI review menyimpulkan TTD tidak ada padahal ada; nomor dokumen 2-baris dikira terpotong.
**Root Cause:** `pdf_service.extract_text_from_pdf` pakai `page.get_text()` (teks polos). TTD/stempel itu GAMBAR → tak muncul di teks → AI kira kosong. Nomor yang wrap ke baris berikut dipisah newline → AI kira terpotong. LLM cuma diberi teks, buta terhadap visual.
**Fix:** OCR Vision hybrid — `render_review_images()` render halaman penting (pertama+terakhir, lebih utk scan) jadi PNG base64; `review_document_text` kirim teks+gambar multimodal ke Gemini 2.5 Flash (`google/gemini-2.5-flash` via OpenRouter, default saat ada gambar walau AI_MODEL=gpt-oss-120b text-only); prompt baru tegaskan TTD/stempel = gambar, cek dulu. Marker `· vision` di reviewed_by. Plus fitur "Temuan kurang tepat" (dismiss false-positive, simpan ke kolom `findings_feedback_json`) sebagai jaring pengaman. Verified doc 29: reviewed_by=`gemini-2.5-flash · vision`, AI eksplisit sebut "Berdasarkan gambar...".
**Tags:** #lontarasign #ai #ocr #vision #openrouter #gemini #pymupdf

## [2026-06-10] Issue: Setelah deploy frontend, user masih lihat UI lama (bundle JS stale)
**Context:** Deploy bundle baru sukses (server serve index-Daz_E_Qu.js berisi kode baru), tapi browser masih muat index-CkJ4EWxo.js lama → badge OCR Vision tak muncul.
**Problem:** Browser muat index.html lama dari HTTP cache → referensi ke bundle JS lama (hash beda dari yang di server).
**Root Cause:** nginx serve index.html dengan cache default (tanpa no-cache). SPA/PWA: index.html WAJIB selalu di-revalidate supaya client ambil hash bundle terbaru tiap deploy. Tanpa itu returning user lihat versi lama sampai cache kedaluwarsa.
**Fix:** Sementara: cache-bust query (`?cb=771`) atau Ctrl+Shift+R. Permanen (belum diterapkan): set `Cache-Control: no-cache` untuk index.html di nginx Dockerfile.prod frontend (hashed assets boleh long-cache, index.html jangan).
**Tags:** #lontarasign #nginx #pwa #cache #deploy #spa
