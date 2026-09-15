from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func
from app.db.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    file_name = Column(String, nullable=True)
    status = Column(String, default="uploaded")
    report_text = Column(String)
    pdf_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
