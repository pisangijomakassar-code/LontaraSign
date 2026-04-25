import base64
import re
import uuid

from fastapi import HTTPException, UploadFile

from app.core.config import ORIGINAL_DIR, SIGNATURE_DIR, USER_SIGS_DIR
from app.utils.constants import BLOCKED_FILENAME_KEYWORDS, MAX_PDF_SIZE_BYTES
from app.utils.helpers import sanitize_filename


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
    return str(file_path)
