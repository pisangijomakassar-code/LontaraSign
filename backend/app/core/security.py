import secrets
from typing import Dict, Optional

TOKENS: Dict[str, int] = {}


def issue_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    TOKENS[token] = user_id
    return token


def get_user_id_from_token(token: str) -> Optional[int]:
    return TOKENS.get(token)


def revoke_token(token: str) -> None:
    TOKENS.pop(token, None)
