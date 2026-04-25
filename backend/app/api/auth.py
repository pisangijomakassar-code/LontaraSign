from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.core.security import issue_token
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.utils.helpers import hash_password, verify_password

from app.core.limiter import limiter


class PatchMeRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

router = APIRouter()


def _org_dict(db: Session, org_id):
    if not org_id:
        return None
    org = db.scalar(select(Organization).where(Organization.id == org_id))
    if not org:
        return None
    return {"id": org.id, "name": org.name, "slug": org.slug, "logo_url": org.logo_url}


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email, User.is_active == True))
    if not user or not verify_password(payload.password, user.password_hash):
        return error_response(401, "Email atau password salah")
    token = issue_token(user.id)
    return success_response("Login berhasil", {
        "token": token,
        "user": _user_dict(user, db),
    })


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return success_response("Data user", _user_dict(current_user, db))


@router.patch("/me")
def patch_me(
    payload: PatchMeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name.strip() or current_user.name
    if payload.title is not None:
        current_user.title = payload.title.strip() or None
    if payload.new_password:
        if not payload.current_password:
            return error_response(400, "Password lama diperlukan untuk ganti password")
        if not verify_password(payload.current_password, current_user.password_hash):
            return error_response(400, "Password lama tidak sesuai")
        if len(payload.new_password) < 6:
            return error_response(400, "Password baru minimal 6 karakter")
        current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return success_response("Profil diperbarui", _user_dict(current_user, db))


def _user_dict(user: User, db: Session) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "title": user.title,
        "organization_id": user.organization_id,
        "organization": _org_dict(db, user.organization_id),
    }
