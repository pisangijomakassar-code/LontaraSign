from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.responses import error_response, success_response
from app.core.security import issue_token
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.utils.helpers import verify_password

router = APIRouter()


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email, User.is_active == True))
    if not user or not verify_password(payload.password, user.password_hash):
        return error_response(401, "Email atau password salah")
    token = issue_token(user.id)
    return success_response("Login berhasil", {
        "token": token,
        "user": _user_dict(user),
    })


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return success_response("Data user", _user_dict(current_user))


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "title": user.title,
    }
