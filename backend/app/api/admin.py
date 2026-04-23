from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.responses import success_response
from app.models.document import Document
from app.models.log import DocumentLog
from app.models.review import DocumentReview
from app.models.signature import DocumentSignature
from app.models.user import User

router = APIRouter()


@router.get("/documents")
def admin_list_documents(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    docs = db.scalars(select(Document).order_by(Document.uploaded_at.desc())).all()
    uploaders = {u.id: u for u in db.scalars(select(User)).all()}

    return success_response("Semua dokumen (admin)", {"items": [
        {
            "id": d.id,
            "document_code": d.document_code,
            "title": d.title,
            "status": d.status,
            "uploaded_by_name": uploaders.get(d.uploaded_by, User()).name if d.uploaded_by in uploaders else None,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        }
        for d in docs
    ]})


@router.get("/documents/{doc_id}")
def admin_get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        from app.core.responses import error_response
        error_response(404, "Dokumen tidak ditemukan")

    uploader = db.scalar(select(User).where(User.id == doc.uploaded_by))
    review = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))
    sig = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id)
        .order_by(DocumentSignature.id.desc())
    )

    return success_response("Detail dokumen (admin)", {
        "id": doc.id,
        "document_code": doc.document_code,
        "title": doc.title,
        "status": doc.status,
        "current_version_label": doc.current_version_label,
        "uploaded_by": {"id": uploader.id, "name": uploader.name, "email": uploader.email} if uploader else None,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "review": {
            "ai_summary": review.ai_summary,
            "reviewed_at": review.reviewed_at.isoformat() if review and review.reviewed_at else None,
        } if review else None,
        "signature": {
            "signer_name": sig.signer_name_snapshot,
            "signed_at": sig.signed_at.isoformat() if sig and sig.signed_at else None,
        } if sig else None,
    })


@router.get("/documents/{doc_id}/timeline")
def admin_document_timeline(
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    logs = db.scalars(
        select(DocumentLog)
        .where(DocumentLog.document_id == doc_id)
        .order_by(DocumentLog.created_at.asc())
    ).all()
    return success_response("Timeline dokumen", {"items": [
        {
            "id": log.id,
            "actor_name": log.actor_name,
            "actor_role": log.actor_role,
            "action": log.action,
            "description": log.description,
            "meta": log.meta_json,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]})
