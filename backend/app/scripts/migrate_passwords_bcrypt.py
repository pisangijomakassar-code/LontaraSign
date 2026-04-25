"""
One-time migration: re-hash all SHA-256 passwords to bcrypt.
Run ONCE after deploying bcrypt upgrade:
    docker compose exec backend python -m app.scripts.migrate_passwords_bcrypt
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User
from app.utils.helpers import hash_password

DEMO_PASSWORD = "password123"

def migrate():
    db = SessionLocal()
    try:
        users = db.scalars(select(User)).all()
        updated = 0
        for u in users:
            # SHA-256 hashes are 64 hex chars; bcrypt starts with $2b$
            if len(u.password_hash) == 64 and not u.password_hash.startswith("$2"):
                u.password_hash = hash_password(DEMO_PASSWORD)
                updated += 1
                print(f"  [re-hash] {u.email}")
        db.commit()
        print(f"\nDone: {updated} passwords migrated to bcrypt.")
        print("All demo accounts now use password: password123")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
