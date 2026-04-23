from typing import Optional
from pydantic import BaseModel


class DocumentUploadForm(BaseModel):
    title: Optional[str] = None
