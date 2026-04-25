from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.core.security import issue_token
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.utils.helpers import verify_password

router = APIRouter()

def _get_limiter():
    from app.main import limiter
    return limiter


def _org_dict(db: Session, org_id):
    if not org_id:
        return None
    org = db.scalar(select(Organization).where(Organization.id == org_id))
    if not org:
        return None
    return {"id": org.id, "name": org.name, "slug": org.slug, "logo_url": org.logo_url}


@router.post("/login")
@_get_limiter().limit("10/minute")
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
