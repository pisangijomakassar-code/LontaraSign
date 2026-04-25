import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
APP_NAME = "LontaraSign MVP API"
APP_VERSION = "0.3.0"
APP_ENV = os.getenv("APP_ENV", "development")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

_raw_key = os.getenv("SECRET_KEY", "").strip()
SECRET_KEY: str = _raw_key if _raw_key else secrets.token_urlsafe(32)

_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]
)

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "lontarasign_mvp")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
)

STORAGE_DIR = BASE_DIR / "storage"
ORIGINAL_DIR = STORAGE_DIR / "original"
SIGNATURE_DIR = STORAGE_DIR / "signatures"
SIGNED_DIR = STORAGE_DIR / "signed"
SHARE_DIR = STORAGE_DIR / "share"
USER_SIGS_DIR = STORAGE_DIR / "user_signatures"

for _p in [STORAGE_DIR, ORIGINAL_DIR, SIGNATURE_DIR, SIGNED_DIR, SHARE_DIR, USER_SIGS_DIR]:
    _p.mkdir(parents=True, exist_ok=True)
