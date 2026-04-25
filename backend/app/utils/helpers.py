import random
import re
import secrets
from datetime import datetime

import bcrypt as _bcrypt


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def generate_document_code() -> str:
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    num = random.randint(100000, 999999)
    return f"LS-{date_str}-{num:06d}"


def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", filename)


def generate_share_token() -> str:
    return secrets.token_urlsafe(16)
