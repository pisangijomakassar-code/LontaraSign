import hashlib
import io
import os
import shutil
from datetime import datetime, timedelta, timezone

import fitz
import qrcode

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://10.11.3.190")
WITA = timezone(timedelta(hours=8))

# Palet brand
INDIGO = (0.22, 0.25, 0.60)
GOLD   = (0.88, 0.71, 0.23)
INK    = (0.10, 0.10, 0.14)
MUTE   = (0.45, 0.45, 0.52)
SOFT   = (0.97, 0.97, 0.99)
WHITE  = (1.0, 1.0, 1.0)
OK     = (0.13, 0.62, 0.44)
BORDER = (0.87, 0.87, 0.92)
LINE   = (0.80, 0.82, 0.92)


def compute_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def to_wita(dt: datetime) -> datetime:
    """Konversi datetime naive UTC ke WITA (UTC+8)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(WITA)


def fmt_wita(dt: datetime) -> str:
    w = to_wita(dt)
    return w.strftime("%d %b %Y, %H:%M") + " WITA" if w else "-"


def _qr_png_bytes(data: str, box_size: int = 4) -> bytes:
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=box_size, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    buf = io.BytesIO()
    qr.make_image(fill_color="black", back_color="white").save(buf, format="PNG")
    return buf.getvalue()


def append_certificate_page(
    pdf_path: str,
    *,
    document_code: str,
    document_title: str,
    document_hash: str,
    total_pages: int,
    events: list,
    status_label: str = "SELESAI - Ditandatangani Lengkap",
) -> None:
    """Tambah 1 halaman Certificate of Completion (audit trail) di AKHIR PDF.

    Pola DocuSign: TTD tetap inline di dokumen, audit terpusat di halaman ini.
    `events`: list of dict {"title": str, "who": str, "meta": str} urut kronologis.
    """
    doc = fitz.open(pdf_path)
    page = doc.new_page(width=595, height=842)
    W, H = 595, 842

    page.draw_rect(fitz.Rect(0, 0, W, H), color=None, fill=SOFT)

    # ── Header ──
    page.draw_rect(fitz.Rect(0, 0, W, 76), color=None, fill=INDIGO)
    page.insert_text((36, 30), "Lontara", fontsize=17, fontname="hebo", color=WHITE)
    page.insert_text((104, 30), "Sign", fontsize=17, fontname="hebo", color=(0.95, 0.85, 0.35))
    page.insert_text((36, 50), "Tanda Tangan Digital", fontsize=8, fontname="helv", color=(0.78, 0.80, 0.95))
    page.insert_text((W - 36 - 225, 28), "SERTIFIKAT PENYELESAIAN", fontsize=10, fontname="hebo", color=WHITE)
    page.insert_text((W - 36 - 200, 44), "Certificate of Completion", fontsize=8, fontname="helv", color=(0.78, 0.80, 0.95))

    y = 100

    # ── Ringkasan Dokumen ──
    page.insert_text((36, y), "RINGKASAN DOKUMEN", fontsize=9, fontname="hebo", color=MUTE)
    y += 10
    page.draw_rect(fitz.Rect(36, y, W - 36, y + 96), color=BORDER, fill=WHITE, width=0.6)
    half = len(document_hash) // 2 if document_hash else 0
    rows = [
        ("Judul", document_title[:64]),
        ("Kode Dokumen", document_code),
        ("SHA-256", document_hash or "-"),
        ("Total Halaman", f"{total_pages} halaman"),
    ]
    ry = y + 18
    for label, val in rows:
        page.insert_text((50, ry), label, fontsize=8, fontname="hebo", color=MUTE)
        page.insert_text((150, ry), val, fontsize=8.5,
                         fontname=("cour" if label == "SHA-256" else "helv"), color=INK)
        ry += 17
    badge_w = 5 * len(status_label) + 16
    page.draw_rect(fitz.Rect(150, ry - 4, 150 + badge_w, ry + 13), color=None, fill=OK)
    page.insert_text((50, ry + 8), "Status", fontsize=8, fontname="hebo", color=MUTE)
    page.insert_text((158, ry + 8), status_label, fontsize=8, fontname="hebo", color=WHITE)

    y += 116

    # ── Audit Trail ──
    page.insert_text((36, y), "RIWAYAT TANDA TANGAN  (Audit Trail)", fontsize=9, fontname="hebo", color=MUTE)
    y += 10
    trail_h = max(60, len(events) * 56 + 16)
    page.draw_rect(fitz.Rect(36, y, W - 36, y + trail_h), color=BORDER, fill=WHITE, width=0.6)
    ey = y + 22
    for i, ev in enumerate(events):
        page.draw_circle((54, ey - 3), 5, color=None, fill=INDIGO)
        page.insert_text((51.5, ey - 0.5), str(i + 1), fontsize=7, fontname="hebo", color=WHITE)
        if i < len(events) - 1:
            page.draw_line((54, ey + 4), (54, ey + 48), color=LINE, width=1)
        page.insert_text((70, ey), ev.get("title", ""), fontsize=10.5, fontname="hebo", color=INK)
        page.insert_text((70, ey + 15), ev.get("who", ""), fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.38))
        page.insert_text((70, ey + 29), ev.get("meta", ""), fontsize=8, fontname="helv", color=MUTE)
        ey += 56

    y += trail_h + 20

    # ── QR + verify ──
    verify_url = f"{APP_BASE_URL}/verify/{document_code}"
    qr_png = _qr_png_bytes(verify_url)
    qrs = 92
    page.draw_rect(fitz.Rect(32, y - 4, 36 + qrs + 4, y + qrs + 4), color=BORDER, fill=WHITE, width=0.6)
    page.insert_image(fitz.Rect(36, y, 36 + qrs, y + qrs), stream=qr_png)
    page.insert_text((150, y + 16), "Verifikasi keaslian dokumen ini:", fontsize=9.5, fontname="hebo", color=INK)
    page.insert_text((150, y + 34), verify_url, fontsize=8.5, fontname="cour", color=INDIGO)
    page.insert_text((150, y + 54), "Scan QR atau kunjungi tautan untuk memeriksa", fontsize=8, fontname="helv", color=MUTE)
    page.insert_text((150, y + 66), "dokumen tidak dimodifikasi sejak ditandatangani.", fontsize=8, fontname="helv", color=MUTE)

    y += 116

    # ── Legal ──
    page.draw_line((36, y), (W - 36, y), color=BORDER, width=0.6)
    y += 14
    now_str = fmt_wita(datetime.utcnow())
    legal = [
        "Sertifikat ini adalah bukti penyelesaian proses tanda tangan elektronik melalui LontaraSign,",
        "sah sesuai Undang-Undang Nomor 11 Tahun 2008 tentang ITE Pasal 11.",
        f"Dibuat otomatis pada {now_str}.",
    ]
    for ln in legal:
        page.insert_text((36, y), ln, fontsize=7.5, fontname="helv", color=MUTE)
        y += 12

    # ── Footer ──
    page.draw_rect(fitz.Rect(0, H - 30, W, H), color=None, fill=INDIGO)
    page.insert_text((36, H - 11), "LontaraSign  -  Tanda Tangan Digital Berstandar",
                     fontsize=8, fontname="helv", color=(0.78, 0.80, 0.95))
    page.insert_text((W - 95, H - 11), "Hal. sertifikat 1/1",
                     fontsize=7.5, fontname="helv", color=(0.70, 0.72, 0.90))

    tmp = pdf_path + ".tmp"
    doc.save(tmp, garbage=4, clean=True, deflate=True)
    doc.close()
    shutil.move(tmp, pdf_path)
