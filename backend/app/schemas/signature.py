from typing import Optional, Union
from pydantic import BaseModel


class DrawSignatureRequest(BaseModel):
    image_base64: str  # data URL: "data:image/png;base64,..."


class SignFinalizeRequest(BaseModel):
    sign_method: str  # "draw" | "upload"
    page: Union[str, int] = "last"
    position: Optional[dict] = None  # {"x": int, "y": int}
