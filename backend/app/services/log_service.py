from typing import Optional

from sqlalchemy.orm import Session

from app.models.log import DocumentLog


def log_action(
    db: Session,
    document_id: int,
    actor_name: str,
    actor_role: str,
    action: str,
    actor_id: Optional[int] = None,
    description: Optional[str] = None,
    meta: Optional[dict] = None,
) -> None:
    log = DocumentLog(
        document_id=document_id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        description=description,
        meta_json=meta,
    )
    db.add(log)
    db.commit()
