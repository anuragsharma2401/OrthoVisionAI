from pydantic import BaseModel

class PredictionCreate(BaseModel):
    patient_id: int
    disease: str
    confidence: str
    image_path: str

class PredictionResponse(BaseModel):
    id: int
    patient_id: int
    disease: str
    confidence: str
    image_path: str

    class Config:
        from_attributes = True