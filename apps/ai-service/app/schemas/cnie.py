from typing import Optional

from pydantic import BaseModel, ConfigDict


class CNIEProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_number: Optional[str] = None
    surname: Optional[str] = None
    given_name: Optional[str] = None
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    birth_place: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    ocr_text: Optional[str] = None
    # Card-shape detection score (0–100). High value means the card was clearly
    # framed in the photo; it does NOT measure OCR text accuracy.
    confidence: float = 0.0
