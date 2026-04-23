from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.log import DocumentLog
from app.models.user import User

router = APIRouter()


@router.get("/{doc_id}/logs")
def get_logs(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        error_response(404, "Dokumen tidak ditemukan")
    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        error_response(403, "Akses ditolak")

    logs = db.scalars(
        select(DocumentLog)
        .where(DocumentLog.document_id == doc_id)
        .order_by(DocumentLog.created_at.asc())
    ).all()

    return success_response("Log aktivitas dokumen", {"items": [
        {
            "id": log.id,
            "actor_name": log.actor_name,
            "actor_role": log.actor_role,
            "action": log.action,
            "description": log.description,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]})
