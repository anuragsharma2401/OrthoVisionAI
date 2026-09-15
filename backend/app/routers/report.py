from pathlib import Path
from uuid import uuid4
import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

ALLOWED_REPORT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
MAX_REPORT_BYTES = int(os.getenv("ORTHOVISION_MAX_REPORT_BYTES", str(10 * 1024 * 1024)))
REPORT_UPLOAD_DIR = Path(os.getenv("ORTHOVISION_UPLOAD_DIR", "uploads")) / "reports"


@router.get("/")
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.id.desc())
        .all()
    )


@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    patient_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a PDF, JPG, or PNG medical report.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded report is empty.")

    if len(contents) > MAX_REPORT_BYTES:
        raise HTTPException(status_code=400, detail="Medical report must be under 10 MB.")

    await file.seek(0)
    REPORT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "").suffix.lower()
    file_path = REPORT_UPLOAD_DIR / f"{uuid4().hex}{extension}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    report = Report(
        patient_id=patient_id,
        user_id=current_user.id,
        file_name=file.filename,
        status="uploaded",
        report_text="Report uploaded. AI extraction is not connected yet.",
        pdf_path=str(file_path),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Medical report uploaded successfully",
        "report": report,
    }
