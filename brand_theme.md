# Brand Theme — LontaraSign

---

## Palette

| Token | Value |
|---|---|
| Primary           | #2563eb |
| Accent            | #3b82f6 |
| Success           | #16a34a |
| Warning           | #d97706 |
| Danger            | #dc2626 |
| Background base   | #f8fafc |
| Background elev   | #ffffff |
| Text primary      | #0f172a |
| Text secondary    | #475569 |
| Border subtle     | #e2e8f0 |

Dark mode:

| Token | Value |
|---|---|
| Background base   | #0f172a |
| Background elev   | #1e293b |
| Text primary      | #f1f5f9 |
| Text secondary    | #94a3b8 |
| Border subtle     | #334155 |

---

## Typography

- **Body font:** Inter, system-ui, sans-serif
- **Mono font:** JetBrains Mono, ui-monospace, monospace (untuk code, hash dokumen)
- **Display font:** — (reuse body bold)

---

## Mood & Visual Direction

Clean corporate, data-dense. Kesan: profesional, terpercaya, efisien.
Minim dekorasi. Prioritas readability untuk sesi kerja panjang (review dokumen, approval workflow).
Warna biru sebagai sinyal kepercayaan & aksi — bukan estetika.

---

## Default Mode

- [x] Light-first
- [ ] Dark-first
- [ ] Both equal

---

## Spesifik Project — Override dari design_philosophy.md

- **Ilustrasi:** AVOID di halaman kerja (upload, review, sign, dashboard)
  *Alasan:* user spending 10+ menit per sesi, ilustrasi jadi noise.
  *Pengecualian:* empty state boleh pakai ilustrasi ringan (SVG line art).

- **Card density:** boleh data-dense, padding bisa turun ke 12px untuk tabel/list
  *Alasan:* dokumen list & activity log butuh banyak data visible sekaligus.

- **Status badge:** selalu pakai warna + ikon + label teks (triple redundancy)
  *Alasan:* status dokumen (🔴/🟡/🟢) adalah core UX — colorblind safe wajib.

---

## Komponen Utama

- **Document list:** data-dense table, status badge prominent, aksi di kanan
- **AI Review panel:** structured output (🔴/🟡/🟢), collapsible per item
- **Signature drag UI:** canvas/preview area full, minimal chrome di sekitarnya
- **Upload zone:** drag-drop area besar, progress indicator jelas
- **Admin panel:** sidebar nav, content area lebar
