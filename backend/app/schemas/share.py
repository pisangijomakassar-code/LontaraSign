from typing import Optional
from pydantic import BaseModel


class ShareRequest(BaseModel):
    share_method: str  # "link" | "copy_link" | "download" | "email"
    share_target: Optional[str] = None
