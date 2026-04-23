import hashlib
import random
import re
import secrets
from datetime import datetime


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


def generate_document_code() -> str:
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    num = random.randint(100000, 999999)
    return f"LS-{date_str}-{num:06d}"


def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", filename)


def generate_share_token() -> str:
    return secrets.token_urlsafe(16)
