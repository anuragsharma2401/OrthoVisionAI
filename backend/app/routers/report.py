from pathlib import Path
from uuid import uuid4
import json
import logging
import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.gemini_service import GeminiNotConfiguredError, analyze_medical_report

logger = logging.getLogger(__name__)

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
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.id.desc())
        .all()
    )
    return [serialize_report(report) for report in reports]


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

    analysis = {}
    analysis_error = None
    status_value = "uploaded"

    try:
        analysis = analyze_medical_report(str(file_path))
        status_value = "analyzed"
    except GeminiNotConfiguredError as exc:
        analysis_error = str(exc)
        status_value = "uploaded"
    except Exception as exc:
        logger.exception("Gemini report analysis failed for uploaded report %s", file_path)
        analysis_error = "Gemini report analysis failed. The report was uploaded successfully."
        status_value = "analysis_failed"

    report = Report(
        patient_id=patient_id,
        user_id=current_user.id,
        file_name=file.filename,
        status=status_value,
        report_text=analysis.get("explanation") or "Report uploaded. AI analysis is unavailable.",
        analysis_json=json.dumps(analysis, ensure_ascii=False) if analysis else None,
        explanation=analysis.get("explanation"),
        findings=json.dumps(analysis.get("key_findings", []), ensure_ascii=False),
        guidance=analysis.get("home_care_guidance") or analysis.get("recovery_information"),
        analysis_error=analysis_error,
        pdf_path=str(file_path),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Medical report uploaded successfully",
        "report": serialize_report(report),
    }


def serialize_report(report: Report) -> dict:
    key_findings = []
    if report.findings:
        try:
            key_findings = json.loads(report.findings)
        except json.JSONDecodeError:
            key_findings = [report.findings]

    analysis = {}
    if report.analysis_json:
        try:
            analysis = json.loads(report.analysis_json)
        except json.JSONDecodeError:
            analysis = {}

    return {
        "id": report.id,
        "patient_id": report.patient_id,
        "file_name": report.file_name,
        "status": report.status,
        "report_text": report.report_text,
        "explanation": report.explanation,
        "key_findings": key_findings,
        "guidance": report.guidance,
        "analysis_error": report.analysis_error,
        "analysis": analysis,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }
