from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, text

from app.core.limiter import limiter

from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.review import router as review_router
from app.api.signature import router as signature_router
from app.api.share import router as share_router
from app.api.logs import router as logs_router
from app.api.admin import router as admin_router
from app.api.verify import router as verify_router
from app.api.saved_signature import router as saved_signature_router
from app.core.config import ALLOWED_ORIGINS
from app.core.database import Base, engine, SessionLocal

# Import models so SQLAlchemy creates all tables
import app.models.organization  # noqa
import app.models.user          # noqa
import app.models.document      # noqa
import app.models.review        # noqa
import app.models.signature     # noqa
import app.models.share         # noqa
import app.models.log           # noqa
import app.models.saved_signature  # noqa
import app.models.user_token  # noqa

from app.models.organization import Organization
from app.models.user import User
from app.models.document import Document

app = FastAPI(title="LontaraSign MVP API", version="0.3.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _migrate_add_org_columns(db):
    """Add organization_id columns to existing tables if missing (MySQL)."""
    try:
        db.execute(text(
            "ALTER TABLE users ADD COLUMN organization_id INT NULL, "
            "ADD INDEX ix_users_organization_id (organization_id)"
        ))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text(
            "ALTER TABLE documents ADD COLUMN organization_id INT NULL, "
            "ADD INDEX ix_documents_organization_id (organization_id)"
        ))
        db.commit()
    except Exception:
        db.rollback()


def _seed_default_org_and_backfill(db):
    """Ensure at least one organization exists and backfill null org_ids."""
    org = db.scalar(select(Organization).where(Organization.slug == "kalla-group"))
    if not org:
        org = Organization(name="Kalla Group", slug="kalla-group")
        db.add(org)
        db.commit()
        db.refresh(org)

    # Backfill users
    db.execute(text("UPDATE users SET organization_id = :oid WHERE organization_id IS NULL"),
               {"oid": org.id})
    db.execute(text("UPDATE documents SET organization_id = :oid WHERE organization_id IS NULL"),
               {"oid": org.id})
    db.commit()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine, checkfirst=True)
    db = SessionLocal()
    try:
        _migrate_add_org_columns(db)
        _seed_default_org_and_backfill(db)
    finally:
        db.close()


app.include_router(auth_router,             prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(documents_router,        prefix="/api/v1/documents", tags=["Documents"])
app.include_router(review_router,           prefix="/api/v1/documents", tags=["Review"])
app.include_router(signature_router,        prefix="/api/v1/documents", tags=["Signature"])
app.include_router(share_router,            prefix="/api/v1/documents", tags=["Share"])
app.include_router(logs_router,             prefix="/api/v1/documents", tags=["Logs"])
app.include_router(admin_router,            prefix="/api/v1/admin",     tags=["Admin"])
app.include_router(verify_router,           prefix="/api/v1",           tags=["Verify"])
app.include_router(saved_signature_router,  prefix="/api/v1/users",     tags=["Saved Signatures"])


@app.get("/")
def root():
    return {"success": True, "message": "LontaraSign MVP API aktif", "version": "0.3.0"}
