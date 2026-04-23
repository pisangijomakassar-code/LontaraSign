from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    original_file_name: Mapped[str] = mapped_column(String(255))
    original_file_path: Mapped[str] = mapped_column(String(500))
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(
        Enum("draft_uploaded", "reviewed_by_ai", "needs_revision", "approved", "pending_sign", "signed"),
        default="draft_uploaded",
    )
    current_version_label: Mapped[str] = mapped_column(String(50), default="v1")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
