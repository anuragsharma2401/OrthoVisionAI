from sqlalchemy import Column, DateTime, Float, Integer, String, ForeignKey, func
from app.db.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    disease = Column(String)
    confidence = Column(String)
    confidence_score = Column(Float, nullable=True)
    detected_bone = Column(String, nullable=True)
    status = Column(String, default="completed")
    summary = Column(String, nullable=True)
    image_path = Column(String)
    result_image_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
