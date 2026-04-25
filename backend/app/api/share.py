from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import APP_BASE_URL
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.share import DocumentShare
from app.models.signature import DocumentSignature
from app.models.user import User
from app.schemas.share import ShareRequest
from app.services.log_service import log_action
from app.utils.helpers import generate_share_token

router = APIRouter()


@router.post("/{doc_id}/share")
def share_document(
    doc_id: int,
    payload: ShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)
    if doc.status != "signed":
        error_response(400, "Hanya dokumen yang sudah ditandatangani yang dapat di-share")

    token = generate_share_token()
    share = DocumentShare(
        document_id=doc_id,
        shared_by=current_user.id,
        share_method=payload.share_method,
        share_target=payload.share_target,
        share_token=token,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    verify_url = f"{APP_BASE_URL}/api/v1/verify/{doc_id}"
    log_action(
        db, doc_id, current_user.name, current_user.role, "share",
        actor_id=current_user.id,
        description=f"Dokumen di-share via '{payload.share_method}'",
        meta={"method": payload.share_method, "target": payload.share_target},
    )

    return success_response("Dokumen berhasil di-share", {
        "share_token": token,
        "share_method": payload.share_method,
        "verify_url": verify_url,
    })


@router.get("/{doc_id}/share-history")
def share_history(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_doc(doc_id, current_user.id, db)
    shares = db.scalars(
        select(DocumentShare).where(DocumentShare.document_id == doc_id).order_by(DocumentShare.shared_at.desc())
    ).all()
    return success_response("Riwayat share", {"items": [
        {
            "id": s.id,
            "share_method": s.share_method,
            "share_token": s.share_token,
            "share_target": s.share_target,
            "shared_at": s.shared_at.isoformat() if s.shared_at else None,
        }
        for s in shares
    ]})


def _get_owned_doc(doc_id: int, user_id: int, db: Session) -> Document:
    from app.models.user import User as _U
    user = db.scalar(select(_U).where(_U.id == user_id))
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        error_response(404, "Dokumen tidak ditemukan")
    if user and user.organization_id and doc.organization_id == user.organization_id:
        return doc
    if doc.uploaded_by != user_id:
        error_response(403, "Akses ditolak")
    return doc
