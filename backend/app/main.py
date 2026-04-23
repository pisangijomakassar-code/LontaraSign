from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.review import router as review_router
from app.api.signature import router as signature_router
from app.api.share import router as share_router
from app.api.logs import router as logs_router
from app.api.admin import router as admin_router
from app.api.verify import router as verify_router
from app.core.database import Base, engine

# Import models so SQLAlchemy creates all tables
import app.models.user  # noqa
import app.models.document  # noqa
import app.models.review  # noqa
import app.models.signature  # noqa
import app.models.share  # noqa
import app.models.log  # noqa

app = FastAPI(title="LontaraSign MVP API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    Base.metadata.create_all(bind=engine, checkfirst=True)
except Exception:
    pass  # Tables already exist

app.include_router(auth_router,      prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(review_router,    prefix="/api/v1/documents", tags=["Review"])
app.include_router(signature_router, prefix="/api/v1/documents", tags=["Signature"])
app.include_router(share_router,     prefix="/api/v1/documents", tags=["Share"])
app.include_router(logs_router,      prefix="/api/v1/documents", tags=["Logs"])
app.include_router(admin_router,     prefix="/api/v1/admin",     tags=["Admin"])
app.include_router(verify_router,    prefix="/api/v1",           tags=["Verify"])


@app.get("/")
def root():
    return {"success": True, "message": "LontaraSign MVP API aktif", "version": "0.2.0"}
