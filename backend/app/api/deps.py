from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_id_from_token
from app.models.user import User


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"success": False, "message": "Token tidak valid", "errors": {}})
    token = authorization.removeprefix("Bearer ").strip()
    user_id = get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Sesi tidak ditemukan atau sudah kedaluwarsa", "errors": {}})
    user = db.scalar(select(User).where(User.id == user_id, User.is_active == True))
    if not user:
        raise HTTPException(status_code=401, detail={"success": False, "message": "User tidak ditemukan", "errors": {}})
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail={"success": False, "message": "Akses ditolak — hanya admin", "errors": {}})
    return current_user
