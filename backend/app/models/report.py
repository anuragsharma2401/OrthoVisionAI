from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text, func
from app.db.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    file_name = Column(String, nullable=True)
    status = Column(String, default="uploaded")
    report_text = Column(Text)
    analysis_json = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    guidance = Column(Text, nullable=True)
    analysis_error = Column(Text, nullable=True)
    pdf_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
