from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.signature import DocumentSignature
from app.models.user import User

router = APIRouter()


@router.get("/verify/{doc_id}")
def verify_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        error_response(404, "Dokumen tidak ditemukan")

    uploader = db.scalar(select(User).where(User.id == doc.uploaded_by))
    sig = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id)
        .order_by(DocumentSignature.id.desc())
    )

    return success_response("Informasi verifikasi dokumen", {
        "document_code": doc.document_code,
        "title": doc.title,
        "status": doc.status,
        "uploaded_by": uploader.name if uploader else None,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "signer_name": sig.signer_name_snapshot if sig else None,
        "signer_title": sig.signer_title_snapshot if sig else None,
        "signed_at": sig.signed_at.isoformat() if sig and sig.signed_at else None,
        "is_signed": doc.status == "signed",
    })
