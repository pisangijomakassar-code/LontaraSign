from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentReview(Base):
    __tablename__ = "document_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), unique=True, index=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_points_json: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    ai_notes_json: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    ai_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_system: Mapped[str] = mapped_column(String(150), default="LontaraAI Review v0.1")
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
