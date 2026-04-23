from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import SIGNED_DIR
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.signature import DocumentSignature
from app.models.user import User
from app.schemas.signature import DrawSignatureRequest, SignFinalizeRequest
from app.services.file_service import save_base64_signature, save_signature_image_upload
from app.services.log_service import log_action
from app.services.pdf_service import embed_signature_to_pdf

router = APIRouter()


@router.post("/{doc_id}/signature/draw")
def upload_draw_signature(
    doc_id: int,
    payload: DrawSignatureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_pending_doc(doc_id, current_user.id, db)
    sig_path = save_base64_signature(payload.image_base64, doc.document_code)
    _upsert_signature(db, doc_id, current_user, "draw", sig_path)
    return success_response("Tanda tangan berhasil disimpan", {"sign_method": "draw", "document_id": doc_id})


@router.post("/{doc_id}/signature/upload-image")
async def upload_signature_image(
    doc_id: int,
    signature_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_pending_doc(doc_id, current_user.id, db)
    sig_path = await save_signature_image_upload(signature_image, doc.document_code)
    _upsert_signature(db, doc_id, current_user, "upload", sig_path)
    return success_response("Gambar tanda tangan berhasil diunggah", {"sign_method": "upload", "document_id": doc_id})


@router.post("/{doc_id}/sign-finalize")
def finalize_sign(
    doc_id: int,
    payload: SignFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_pending_doc(doc_id, current_user.id, db)

    sig = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id, DocumentSignature.signer_id == current_user.id)
        .order_by(DocumentSignature.id.desc())
    )
    if not sig or not sig.sign_image_path:
        error_response(400, "Tanda tangan belum diunggah. Harap gunakan endpoint draw atau upload-image terlebih dahulu.")

    pos = payload.position or {}
    x = float(pos.get("x", 380))
    y = float(pos.get("y", 120))

    output_filename = f"{doc.document_code}_signed.pdf"
    output_path = str(SIGNED_DIR / output_filename)

    try:
        embed_signature_to_pdf(
            original_pdf_path=doc.original_file_path,
            sign_image_path=sig.sign_image_path,
            output_path=output_path,
            page=payload.page,
            x=x,
            y=y,
        )
    except Exception as e:
        error_response(500, f"Gagal menempel tanda tangan ke PDF: {str(e)}")

    now = datetime.utcnow()
    sig.sign_method = payload.sign_method
    sig.signed_pdf_path = output_path
    sig.signer_name_snapshot = current_user.name
    sig.signer_title_snapshot = current_user.title
    sig.signed_at = now
    db.commit()

    doc.status = "signed"
    db.commit()

    log_action(
        db, doc_id, current_user.name, current_user.role, "signed",
        actor_id=current_user.id,
        description=f"Dokumen ditandatangani dengan metode '{payload.sign_method}'",
        meta={"sign_method": payload.sign_method, "page": str(payload.page), "x": x, "y": y},
    )

    return success_response("Dokumen berhasil ditandatangani", {
        "document_id": doc_id,
        "status": "signed",
        "signed_at": now.isoformat(),
        "signer_name": current_user.name,
    })


@router.get("/{doc_id}/download-signed")
def download_signed(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)
    if doc.status != "signed":
        error_response(400, "Dokumen belum ditandatangani")

    sig = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id)
        .order_by(DocumentSignature.id.desc())
    )
    if not sig or not sig.signed_pdf_path:
        error_response(404, "File signed PDF tidak ditemukan")

    signed_path = Path(sig.signed_pdf_path)
    if not signed_path.exists():
        error_response(404, "File signed PDF tidak ada di storage")

    filename = f"{doc.document_code}_signed.pdf"
    return FileResponse(
        path=str(signed_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _get_owned_doc(doc_id: int, user_id: int, db: Session) -> Document:
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        error_response(404, "Dokumen tidak ditemukan")
    if doc.uploaded_by != user_id:
        error_response(403, "Akses ditolak")
    return doc


def _get_pending_doc(doc_id: int, user_id: int, db: Session) -> Document:
    doc = _get_owned_doc(doc_id, user_id, db)
    if doc.status != "pending_sign":
        error_response(400, f"Dokumen harus berstatus 'pending_sign' untuk ditandatangani (saat ini: '{doc.status}')")
    return doc


def _upsert_signature(db: Session, doc_id: int, user: User, method: str, sig_path: str):
    existing = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id, DocumentSignature.signer_id == user.id)
    )
    if existing:
        existing.sign_method = method
        existing.sign_image_path = sig_path
        existing.signed_pdf_path = None
        existing.signed_at = None
    else:
        sig = DocumentSignature(
            document_id=doc_id,
            signer_id=user.id,
            sign_method=method,
            sign_image_path=sig_path,
        )
        db.add(sig)
    db.commit()
