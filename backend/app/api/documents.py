from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.review import DocumentReview
from app.models.signature import DocumentSignature
from app.models.share import DocumentShare
from app.models.user import User
from app.services.file_service import save_uploaded_pdf
from app.services.log_service import log_action
from app.utils.helpers import generate_document_code

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc_code = generate_document_code()
    file_path, original_name = await save_uploaded_pdf(file, doc_code)

    doc_title = title.strip() if title and title.strip() else original_name

    doc = Document(
        document_code=doc_code,
        title=doc_title,
        original_file_name=original_name,
        original_file_path=file_path,
        uploaded_by=current_user.id,
        status="draft_uploaded",
        current_version_label="v1",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_action(
        db, doc.id, current_user.name, current_user.role, "upload",
        actor_id=current_user.id,
        description=f"Dokumen '{doc_title}' diunggah",
    )

    return success_response("Dokumen berhasil diunggah", _doc_dict(doc))


@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = db.scalars(
        select(Document)
        .where(Document.uploaded_by == current_user.id)
        .order_by(Document.uploaded_at.desc())
    ).all()
    return success_response("Daftar dokumen", {"items": [_doc_dict(d) for d in docs]})


@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)

    review = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))
    sig = db.scalar(
        select(DocumentSignature)
        .where(DocumentSignature.document_id == doc_id)
        .order_by(DocumentSignature.id.desc())
    )
    shares = db.scalars(select(DocumentShare).where(DocumentShare.document_id == doc_id)).all()

    return success_response("Detail dokumen", {
        **_doc_dict(doc),
        "review": _review_dict(review) if review else None,
        "signature": _sig_dict(sig) if sig else None,
        "shares": [_share_dict(s) for s in shares],
    })


def _get_owned_doc(doc_id: int, user_id: int, db: Session) -> Document:
    doc = db.scalar(select(Document).where(Document.id == doc_id))
    if not doc:
        error_response(404, "Dokumen tidak ditemukan")
    if doc.uploaded_by != user_id:
        error_response(403, "Akses ditolak")
    return doc


def _doc_dict(doc: Document) -> dict:
    return {
        "id": doc.id,
        "document_code": doc.document_code,
        "title": doc.title,
        "original_file_name": doc.original_file_name,
        "status": doc.status,
        "current_version_label": doc.current_version_label,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


def _review_dict(r: DocumentReview) -> dict:
    return {
        "id": r.id,
        "ai_summary": r.ai_summary,
        "ai_points": r.ai_points_json,
        "ai_notes": r.ai_notes_json,
        "ai_recommendation": r.ai_recommendation,
        "reviewed_by_system": r.reviewed_by_system,
        "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
    }


def _sig_dict(s: DocumentSignature) -> dict:
    return {
        "id": s.id,
        "sign_method": s.sign_method,
        "signer_name": s.signer_name_snapshot,
        "signer_title": s.signer_title_snapshot,
        "signed_at": s.signed_at.isoformat() if s.signed_at else None,
        "has_signed_pdf": bool(s.signed_pdf_path),
    }


def _share_dict(s: DocumentShare) -> dict:
    return {
        "id": s.id,
        "share_method": s.share_method,
        "share_token": s.share_token,
        "shared_at": s.shared_at.isoformat() if s.shared_at else None,
    }
