from typing import Optional
from pydantic import BaseModel


class MarkRevisionRequest(BaseModel):
    note: Optional[str] = None


class ApproveRequest(BaseModel):
    note: Optional[str] = None
