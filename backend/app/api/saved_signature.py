import base64
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.saved_signature import SavedSignature
from app.models.user import User
from app.services.file_service import save_user_signature_base64, save_user_signature_upload

router = APIRouter()

MAX_SAVED = 10  # per user


@router.get("/me/signatures")
def list_saved_signatures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(SavedSignature)
        .where(SavedSignature.user_id == current_user.id)
        .order_by(SavedSignature.id.desc())
    ).all()
    return success_response("Daftar tanda tangan tersimpan", [_sig_dict(r) for r in rows])


@router.post("/me/signatures/draw")
def save_signature_draw(
    image_base64: str = Form(...),
    label: str = Form("Default"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_limit(current_user.id, db)
    path = save_user_signature_base64(image_base64, current_user.id)
    sig = SavedSignature(user_id=current_user.id, label=label[:100], image_path=path)
    db.add(sig)
    db.commit()
    db.refresh(sig)
    return success_response("Tanda tangan berhasil disimpan", _sig_dict(sig))


@router.post("/me/signatures/upload")
async def save_signature_upload(
    signature_image: UploadFile = File(...),
    label: str = Form("Default"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_limit(current_user.id, db)
    path = await save_user_signature_upload(signature_image, current_user.id)
    sig = SavedSignature(user_id=current_user.id, label=label[:100], image_path=path)
    db.add(sig)
    db.commit()
    db.refresh(sig)
    return success_response("Tanda tangan berhasil disimpan", _sig_dict(sig))


@router.delete("/me/signatures/{sig_id}")
def delete_saved_signature(
    sig_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sig = db.scalar(select(SavedSignature).where(SavedSignature.id == sig_id))
    if not sig or sig.user_id != current_user.id:
        error_response(404, "Tanda tangan tidak ditemukan")
    p = Path(sig.image_path)
    if p.exists():
        p.unlink(missing_ok=True)
    db.delete(sig)
    db.commit()
    return success_response("Tanda tangan dihapus", {"id": sig_id})


def _check_limit(user_id: int, db: Session):
    count = db.scalar(
        select(SavedSignature).where(SavedSignature.user_id == user_id)
    )
    # count via len isn't ideal but works for small numbers
    rows = db.scalars(select(SavedSignature).where(SavedSignature.user_id == user_id)).all()
    if len(rows) >= MAX_SAVED:
        error_response(400, f"Batas maksimal {MAX_SAVED} tanda tangan tersimpan telah tercapai. Hapus salah satu terlebih dahulu.")


def _sig_dict(sig: SavedSignature) -> dict:
    img_b64 = ""
    try:
        with open(sig.image_path, "rb") as f:
            img_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except Exception:
        pass
    return {
        "id": sig.id,
        "label": sig.label,
        "image_base64": img_b64,
        "created_at": sig.created_at.isoformat() if sig.created_at else None,
    }
