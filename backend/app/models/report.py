from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    report_text = Column(String)
    pdf_path = Column(String)