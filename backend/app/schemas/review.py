from typing import Dict, Optional
from pydantic import BaseModel


class MarkRevisionRequest(BaseModel):
    note: Optional[str] = None


class ApproveRequest(BaseModel):
    note: Optional[str] = None


class FindingFeedback(BaseModel):
    status: str = "open"  # "open" | "resolved" | "dismissed"
    reason: Optional[str] = ""


class FindingsFeedbackRequest(BaseModel):
    # map index-temuan (string) → {status, reason}
    feedback: Dict[str, FindingFeedback] = {}
