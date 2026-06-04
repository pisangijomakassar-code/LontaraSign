import hashlib
import io
import os
import shutil
from datetime import datetime, timedelta, timezone

import fitz
import qrcode
from qrcode.image.pure import PyPNGImage

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://10.11.3.190")
FOOTER_H = 18   # footer strip height in points
QR_SIZE   = 42  # QR stamp size in points
WITA      = timezone(timedelta(hours=8))


def compute_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def _qr_png_bytes(data: str) -> bytes:
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=3, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(image_factory=PyPNGImage)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue()


def _to_wita(dt: datetime) -> datetime:
    """Convert naive UTC datetime to WITA (UTC+8)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(WITA)


def append_certificate_page(
    pdf_path: str,
    document_code: str,
    document_title: str,
    document_hash: str,
    signer_name: str,
    signer_email: str,
    signer_title: str,
    signed_at: datetime,
    signer_ip: str = "-",
) -> None:
    """Add footer strip + QR stamp to every page of the signed PDF."""
    doc = fitz.open(pdf_path)

    INDIGO = (0.22, 0.25, 0.60)
    WHITE  = (1.0, 1.0, 1.0)
    LIGHT  = (0.80, 0.82, 0.95)

    # Convert timestamp to WITA
    signed_wita  = _to_wita(signed_at)
    date_str     = signed_wita.strftime("%d/%m/%Y %H:%M")
    verify_url   = f"{APP_BASE_URL}/verify/{document_code}"
    qr_png       = _qr_png_bytes(verify_url)

    for page in doc:
        W = page.rect.width
        H = page.rect.height

        # ── Footer bar ────────────────────────────────────────────
        page.draw_rect(fitz.Rect(0, H - FOOTER_H, W, H),
                       color=None, fill=INDIGO)

        # Left: brand
        page.insert_text((8, H - 5), "LontaraSign",
                         fontsize=7, fontname="hebo", color=WHITE)

        # Center: signer + date (WITA)
        center = f"Ditandatangani: {signer_name}  |  {date_str} WITA"
        page.insert_text((W / 2 - 85, H - 5), center,
                         fontsize=6.5, fontname="helv", color=WHITE)

        # Right: doc code
        page.insert_text((W - 108, H - 5), document_code,
                         fontsize=6.5, fontname="cour", color=LIGHT)

        # ── QR stamp (bottom-right, above footer) ─────────────────
        qr_x = W - QR_SIZE - 6
        qr_y = H - FOOTER_H - QR_SIZE - 4
        qr_rect = fitz.Rect(qr_x, qr_y, qr_x + QR_SIZE, qr_y + QR_SIZE)

        # White background for QR
        page.draw_rect(fitz.Rect(qr_x - 2, qr_y - 2,
                                 qr_x + QR_SIZE + 2, qr_y + QR_SIZE + 2),
                       color=None, fill=WHITE)
        page.insert_image(qr_rect, stream=qr_png)

        # Tiny "Scan to verify" label
        page.insert_text((qr_x - 1, qr_y + QR_SIZE + 9),
                         "Scan verify",
                         fontsize=5, fontname="helv", color=(0.5, 0.5, 0.6))

    tmp = pdf_path + ".tmp"
    doc.save(tmp, garbage=4, clean=True, deflate=True)
    doc.close()
    shutil.move(tmp, pdf_path)
