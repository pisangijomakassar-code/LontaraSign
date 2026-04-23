from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentShare(Base):
    __tablename__ = "document_shares"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), index=True)
    shared_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    share_method: Mapped[str] = mapped_column(String(50))
    share_target: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    share_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    shared_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
