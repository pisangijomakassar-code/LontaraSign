from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.models.document import Document
from app.models.review import DocumentReview
from app.models.user import User
from app.schemas.review import ApproveRequest, MarkRevisionRequest
from app.services.ai_review import review_document_text
from app.services.log_service import log_action
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter()


@router.post("/{doc_id}/review")
async def trigger_review(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)

    # Idempotent: kalau sudah di-review, langsung kembalikan hasil existing (skip AI call).
    # Re-review hanya dilakukan untuk draft baru atau dokumen yang ditandai perlu revisi.
    if doc.status not in ("draft_uploaded", "needs_revision"):
        existing = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))
        if existing:
            return success_response("Review sudah tersedia", _review_dict(existing))
        error_response(400, f"Dokumen dengan status '{doc.status}' tidak dapat di-review")

    # Extract text
    text = ""
    try:
        text = extract_text_from_pdf(doc.original_file_path)
    except Exception:
        pass

    result = await review_document_text(text, db=db)

    # Upsert review record — tahan race condition (mis. React StrictMode double-invoke).
    # Strategi: coba INSERT dulu, kalau IntegrityError (duplicate document_id),
    # rollback lalu UPDATE record yang sudah ada.
    from sqlalchemy.exc import IntegrityError
    existing = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))
    if existing is None:
        review = DocumentReview(
            document_id=doc_id,
            extracted_text=text,
            ai_summary=result["summary"],
            ai_points_json=result["points"],
            ai_notes_json=result["notes"],
            ai_recommendation=result["recommendation"],
            reviewed_by_system=result["reviewed_by_system"],
        )
        db.add(review)
        try:
            db.commit()
            db.refresh(review)
        except IntegrityError:
            db.rollback()
            existing = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))

    if existing is not None:
        existing.extracted_text = text
        existing.ai_summary = result["summary"]
        existing.ai_points_json = result["points"]
        existing.ai_notes_json = result["notes"]
        existing.ai_recommendation = result["recommendation"]
        existing.reviewed_by_system = result["reviewed_by_system"]
        db.commit()
        db.refresh(existing)
        review = existing

    doc.status = "reviewed_by_ai"
    db.commit()

    log_action(
        db, doc_id, "System", "system", "ai_review",
        description="AI review selesai",
        meta={"reviewed_by": result["reviewed_by_system"]},
    )

    return success_response("Review AI selesai", _review_dict(review))


@router.get("/{doc_id}/review-result")
def get_review_result(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_doc(doc_id, current_user.id, db)
    review = db.scalar(select(DocumentReview).where(DocumentReview.document_id == doc_id))
    if not review:
        error_response(404, "Review belum tersedia untuk dokumen ini")
    return success_response("Hasil review", _review_dict(review))


@router.post("/{doc_id}/mark-revision")
def mark_revision(
    doc_id: int,
    payload: MarkRevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)
    if doc.status != "reviewed_by_ai":
        error_response(400, "Dokumen harus berstatus 'reviewed_by_ai' untuk ditandai perlu revisi")

    doc.status = "needs_revision"
    db.commit()

    log_action(
        db, doc_id, current_user.name, current_user.role, "mark_revision",
        actor_id=current_user.id,
        description=payload.note or "Dokumen ditandai perlu revisi",
    )

    return success_response("Dokumen ditandai perlu revisi", {"id": doc_id, "status": doc.status})


@router.post("/{doc_id}/approve")
def approve_document(
    doc_id: int,
    payload: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = _get_owned_doc(doc_id, current_user.id, db)
    if doc.status != "reviewed_by_ai":
        error_response(400, "Dokumen harus berstatus 'reviewed_by_ai' untuk di-approve")

    doc.status = "pending_sign"
    db.commit()

    log_action(
        db, doc_id, current_user.name, current_user.role, "approve",
        actor_id=current_user.id,
        description=payload.note or "Dokumen disetujui dan siap untuk ditandatangani",
    )

    return success_response("Dokumen disetujui, siap untuk ditandatangani", {"id": doc_id, "status": doc.status})


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


def _review_dict(r: DocumentReview) -> dict:
    return {
        "id": r.id,
        "document_id": r.document_id,
        "ai_summary": r.ai_summary,
        "ai_points": r.ai_points_json,
        "ai_notes": r.ai_notes_json,
        "ai_recommendation": r.ai_recommendation,
        "reviewed_by_system": r.reviewed_by_system,
        "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
    }
