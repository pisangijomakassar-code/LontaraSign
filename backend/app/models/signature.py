from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentSignature(Base):
    __tablename__ = "document_signatures"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), index=True)
    signer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    sign_method: Mapped[Optional[str]] = mapped_column(Enum("draw", "upload"), nullable=True)
    sign_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    signed_pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    signer_name_snapshot: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    signer_title_snapshot: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
