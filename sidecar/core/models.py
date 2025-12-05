from pydantic import BaseModel
from typing import Tuple, Literal

class PrivacyZone(BaseModel):
    """
    Privacy zone definition.
    Defines a region in the frame to be blurred.
    """
    id: str
    region: Tuple[int, int, int, int]  # x1, y1, x2, y2
    shape: Literal["rectangle", "ellipse"] = "rectangle"
    blur_strength: int = 15
