from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    disease = Column(String)
    confidence = Column(String)
    image_path = Column(String)