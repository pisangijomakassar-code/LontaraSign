"""
Run from backend/ directory:
    python -m app.scripts.seed_demo_users
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select
from app.core.database import SessionLocal, engine, Base

# Import ALL models first so FK refs resolve before create_all
import app.models.organization     # noqa
import app.models.user             # noqa
import app.models.document         # noqa
import app.models.review           # noqa
import app.models.signature        # noqa
import app.models.share            # noqa
import app.models.log              # noqa
import app.models.saved_signature  # noqa
import app.models.user_token       # noqa

from app.models.user import User
from app.utils.helpers import hash_password

DEMO_PASSWORD = "password123"

DEMO_USERS = [
    {
        "name": "Nadia Rahma",
        "email": "nadia@lontarasign.local",
        "role": "user",
        "title": "Staff Administrasi",
    },
    {
        "name": "Arif Setiawan",
        "email": "arif@lontarasign.local",
        "role": "user",
        "title": "Department Head Marketing",
    },
    {
        "name": "Admin Demo",
        "email": "admin@lontarasign.local",
        "role": "admin",
        "title": "System Administrator",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created = 0
        for data in DEMO_USERS:
            existing = db.scalar(select(User).where(User.email == data["email"]))
            if existing:
                print(f"  [skip] {data['email']} sudah ada")
                continue
            user = User(
                name=data["name"],
                email=data["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                role=data["role"],
                title=data["title"],
                is_active=True,
            )
            db.add(user)
            created += 1
            print(f"  [+] {data['email']} ({data['role']})")
        db.commit()
        print(f"\nSelesai: {created} user baru dibuat. Password semua: '{DEMO_PASSWORD}'")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding demo users...")
    seed()
