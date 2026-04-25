import secrets
from typing import Optional


def issue_token(user_id: int) -> str:
    """Issue token & persist ke DB supaya survive backend restart."""
    from app.core.database import SessionLocal
    from app.models.user_token import UserToken
    token = secrets.token_urlsafe(32)
    db = SessionLocal()
    try:
        db.add(UserToken(token=token, user_id=user_id))
        db.commit()
    finally:
        db.close()
    return token


def get_user_id_from_token(token: str) -> Optional[int]:
    """Lookup token di DB."""
    from sqlalchemy import select
    from app.core.database import SessionLocal
    from app.models.user_token import UserToken
    if not token:
        return None
    db = SessionLocal()
    try:
        row = db.scalar(select(UserToken).where(UserToken.token == token))
        return row.user_id if row else None
    finally:
        db.close()


def revoke_token(token: str) -> None:
    from sqlalchemy import delete
    from app.core.database import SessionLocal
    from app.models.user_token import UserToken
    db = SessionLocal()
    try:
        db.execute(delete(UserToken).where(UserToken.token == token))
        db.commit()
    finally:
        db.close()
