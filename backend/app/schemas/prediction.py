from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class PredictionCreate(BaseModel):
    patient_id: Optional[int] = None
    disease: str
    confidence: str
    image_path: str

class PredictionResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    disease: str
    confidence: str
    confidence_score: Optional[float] = None
    detected_bone: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    image_path: str
    result_image_path: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
