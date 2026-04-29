import base64
import re
import uuid

import fitz
from fastapi import HTTPException, UploadFile

from app.core.config import ORIGINAL_DIR, SIGNATURE_DIR, USER_SIGS_DIR
from app.utils.constants import BLOCKED_FILENAME_KEYWORDS, MAX_PDF_SIZE_BYTES
from app.utils.helpers import sanitize_filename


# Threshold RGB di atas mana pixel dianggap "putih" dan dijadikan transparan.
# 240 cukup longgar untuk anti-alias edge dari foto/scan tanda tangan.
_WHITE_THRESHOLD = 240


def ensure_transparent_signature(path: str) -> None:
    """Buat pixel near-white pada file gambar signature jadi transparan.

    Dipakai saat menyimpan signature dari upload JPG/PNG yang punya latar putih,
    supaya tidak terlihat seperti kotak "tempel" saat di-embed ke PDF.

    File ditulis ulang sebagai PNG di lokasi yang sama (ekstensi tidak diubah).
    Bila gambar sudah memiliki alpha dan mayoritas latar transparan, fungsi ini
    tetap aman dijalankan (idempotent, hanya menulis ulang file).
    """
    try:
        pix = fitz.Pixmap(path)
    except Exception:
        return

    w, h = pix.width, pix.height
    n_pixels = w * h
    src = pix.samples

    if pix.n == 4 and pix.alpha:
        # Sudah RGBA. Patch alpha=0 untuk pixel near-white, lainnya tidak diubah.
        out = bytearray(src)
        for i in range(0, len(out), 4):
            if (out[i] >= _WHITE_THRESHOLD
                    and out[i + 1] >= _WHITE_THRESHOLD
                    and out[i + 2] >= _WHITE_THRESHOLD):
                out[i + 3] = 0
    elif pix.n == 3 and not pix.alpha:
        # RGB tanpa alpha (kasus JPG / PNG opaque). Bangun RGBA manual:
        # pixel near-white → alpha=0 (transparan); selain itu → alpha=255 (opaque).
        # Catatan: fitz.Pixmap(pix, 1) TIDAK menginisialisasi alpha ke 255 — alpha-nya
        # acak (uninitialized memory), jadi kita bangun samples sendiri di sini.
        out = bytearray(n_pixels * 4)
        for i in range(n_pixels):
            r, g, b = src[i * 3], src[i * 3 + 1], src[i * 3 + 2]
            out[i * 4] = r
            out[i * 4 + 1] = g
            out[i * 4 + 2] = b
            out[i * 4 + 3] = 0 if (r >= _WHITE_THRESHOLD and g >= _WHITE_THRESHOLD and b >= _WHITE_THRESHOLD) else 255
    else:
        # Format tak terduga (gray/CMYK) — biarkan apa adanya.
        return

    new_pix = fitz.Pixmap(fitz.csRGB, w, h, bytes(out), True)
    new_pix.save(path)


async def save_uploaded_pdf(file: UploadFile, document_code: str) -> tuple[str, str]:
    content_type = file.content_type or ""
    if "pdf" not in content_type and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Hanya file PDF yang diperbolehkan", "errors": {}})

    filename_lower = (file.filename or "").lower()
    for kw in BLOCKED_FILENAME_KEYWORDS:
        if kw in filename_lower:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": f"Nama file mengandung kata yang tidak diperbolehkan: '{kw}'", "errors": {}},
            )

    content = await file.read()
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Ukuran file melebihi batas 20 MB", "errors": {}})

    # PDF magic bytes check
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail={"success": False, "message": "File bukan PDF valid", "errors": {}})

    safe_name = sanitize_filename(file.filename or "document.pdf")
    final_name = f"{document_code}_{safe_name}"
    file_path = ORIGINAL_DIR / final_name

    with open(file_path, "wb") as f:
        f.write(content)

    return str(file_path), file.filename or "document.pdf"


def save_base64_signature(image_base64: str, document_code: str) -> str:
    # Strip data URL prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Format base64 tidak valid", "errors": {}})

    filename = f"{document_code}_sig_draw.png"
    file_path = SIGNATURE_DIR / filename
    with open(file_path, "wb") as f:
        f.write(image_bytes)
    ensure_transparent_signature(str(file_path))
    return str(file_path)


async def save_signature_image_upload(file: UploadFile, document_code: str) -> str:
    content_type = file.content_type or ""
    if not any(t in content_type for t in ("image/png", "image/jpeg", "image/jpg")):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Hanya file PNG/JPG yang diperbolehkan untuk signature", "errors": {}})

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Ukuran gambar signature melebihi 5 MB", "errors": {}})

    ext = "png" if "png" in content_type else "jpg"
    filename = f"{document_code}_sig_upload.{ext}"
    file_path = SIGNATURE_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)
    ensure_transparent_signature(str(file_path))
    return str(file_path)


def save_user_signature_base64(image_base64: str, user_id: int) -> str:
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Format base64 tidak valid", "errors": {}})
    filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.png"
    file_path = USER_SIGS_DIR / filename
    with open(file_path, "wb") as f:
        f.write(image_bytes)
    ensure_transparent_signature(str(file_path))
    return str(file_path)


async def save_user_signature_upload(file: UploadFile, user_id: int) -> str:
    content_type = file.content_type or ""
    if not any(t in content_type for t in ("image/png", "image/jpeg", "image/jpg")):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Hanya file PNG/JPG yang diperbolehkan", "errors": {}})
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Ukuran gambar melebihi 5 MB", "errors": {}})
    ext = "png" if "png" in content_type else "jpg"
    filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = USER_SIGS_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)
    ensure_transparent_signature(str(file_path))
    return str(file_path)
