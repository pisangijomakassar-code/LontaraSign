from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.log import DocumentLog
from app.models.review import DocumentReview
from app.models.signature import DocumentSignature
from app.models.user import User


class PatchUserRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

router = APIRouter()


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    doc_q = select(Document)
    user_q = select(User)
    if admin.organization_id:
        doc_q = doc_q.where(Document.organization_id == admin.organization_id)
        user_q = user_q.where(User.organization_id == admin.organization_id)

    docs = db.scalars(doc_q).all()
    users = db.scalars(user_q).all()

    return success_response("Statistik admin", {
        "total_documents": len(docs),
        "signed": sum(1 for d in docs if d.status == "signed"),
        "pending_sign": sum(1 for d in docs if d.status == "pending_sign"),
        "in_review": sum(1 for d in docs if d.status in ("draft_uploaded", "reviewed_by_ai", "needs_revision")),
        "total_users": len(users),
        "active_users": sum(1 for u in users if u.is_active),
    })


@router.get("/users")
def admin_list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = select(User).order_by(User.created_at.asc())
    if admin.organization_id:
        q = q.where(User.organization_id == admin.organization_id)
    users = db.scalars(q).all()
    doc_counts = {}
    for doc in db.scalars(select(Document)).all():
        doc_counts[doc.uploaded_by] = doc_counts.get(doc.uploaded_by, 0) + 1

    return success_response("Daftar user", {"items": [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "title": u.title,
            "is_active": u.is_active,
            "document_count": doc_counts.get(u.id, 0),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]})


@router.patch("/users/{user_id}")
def admin_patch_user(
    user_id: int,
    payload: PatchUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        error_response(404, "User tidak ditemukan")
    if user.id == admin.id:
        error_response(400, "Tidak bisa mengubah akun sendiri")
    if payload.role is not None:
        if payload.role not in ("user", "admin"):
            error_response(400, "Role tidak valid")
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    return success_response("User diperbarui", {"id": user.id, "role": user.role, "is_active": user.is_active})


@router.get("/documents")
def admin_list_documents(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = select(Document).order_by(Document.uploaded_at.desc())
    if admin.organization_id:
        q = q.where(Document.organization_id == admin.organization_id)
    docs = db.scalars(q).all()
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
