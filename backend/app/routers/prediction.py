from datetime import datetime
import json
import logging
from pathlib import Path
import sys
from urllib.parse import quote

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.gemini_service import GeminiNotConfiguredError, enrich_xray_analysis
from app.services.prediction_service import ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, save_image
from app.services.report_builder import build_analysis_report_html

REPO_ROOT = Path(__file__).resolve().parents[3]
ML_ROOT = REPO_ROOT / "ml"
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from predictor import predict_xray

logger = logging.getLogger(__name__)
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"

router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"]
)


@router.get("/")
def get_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.id.desc())
        .all()
    )
    return predictions


@router.post("/upload")
async def create_prediction(
    file: UploadFile = File(...),
    patient_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a JPG or PNG X-ray image.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="X-ray image must be under 10 MB.")

    await file.seek(0)
    image_path = save_image(file)

    try:
        ml_result = predict_xray(image_path)  
    except Exception as exc:
        logger.exception("X-ray model inference failed for uploaded file %s", image_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI model could not analyze this image. Please try again.",
        ) from exc

    gemini_result = {}
    gemini_error = None
    try:
        gemini_result = enrich_xray_analysis(image_path, ml_result)
    except GeminiNotConfiguredError as exc:
        gemini_error = str(exc)
    except Exception as exc:
        logger.exception("Gemini X-ray enrichment failed for uploaded file %s", image_path)
        gemini_error = "Gemini enrichment failed. YOLO result is still available."

    confidence_score = ml_result.get("confidence")
    finding = ml_result.get("finding") or ml_result.get("prediction") or "No detection"
    disease = finding
    confidence = (
        f"{confidence_score * 100:.1f}%"
        if isinstance(confidence_score, (int, float))
        else "Not available"
    )
    detected_bone = gemini_result.get("body_region") or "Not provided by YOLO model"
    summary = (
        f"Model detected {len(ml_result.get('detections', []))} finding(s)."
        if ml_result.get("detections")
        else "No model detections were returned for this image."
    )

    new_prediction = Prediction(
        patient_id=patient_id,
        user_id=current_user.id,
        disease=disease,
        confidence=confidence,
        confidence_score=confidence_score,
        detected_bone=detected_bone,
        finding=finding,
        severity=gemini_result.get("severity"),
        explanation=gemini_result.get("explanation"),
        recovery_guidance=gemini_result.get("recovery_information"),
        home_care_guidance=gemini_result.get("home_care_guidance"),
        warning_guidance=gemini_result.get("warning_guidance"),
        gemini_enrichment=json.dumps(gemini_result, ensure_ascii=False) if gemini_result else None,
        status="completed",
        summary=summary,
        image_path=image_path,
        result_image_path=ml_result.get("result_image_path"),
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return {
        "message": "Prediction completed successfully",
        "analysis": {
            "id": new_prediction.id,
            "patient_id": patient_id,
            "status": new_prediction.status,
            "prediction": disease,
            "finding": finding,
            "confidence": confidence,
            "confidence_score": confidence_score,
            "detected_bone": new_prediction.detected_bone,
            "severity": new_prediction.severity,
            "explanation": new_prediction.explanation,
            "recovery_guidance": new_prediction.recovery_guidance,
            "home_care_guidance": new_prediction.home_care_guidance,
            "warning_guidance": new_prediction.warning_guidance,
            "gemini_error": gemini_error,
            "summary": summary,
            "image_path": image_path,
            "result_image_path": new_prediction.result_image_path,
            "result_image_url": get_upload_url(new_prediction.result_image_path),
            "detections": ml_result.get("detections", []),
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }


@router.get("/{prediction_id}/report")
def download_prediction_report(
    prediction_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == current_user.id)
        .first()
    )
    if not prediction:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = prediction_to_dict(prediction)
    html = build_analysis_report_html(
        current_user,
        analysis,
        image_url=absolute_upload_url(request, prediction.result_image_path),
    )
    return Response(
        content=html,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="orthovision-analysis-{prediction.id}.html"'},
    )


def get_upload_url(file_path: str | None) -> str | None:
    if not file_path:
        return None

    path = Path(file_path)
    if not path.is_absolute():
        path = path.resolve()

    try:
        relative_path = path.relative_to(UPLOAD_ROOT.resolve())
    except ValueError:
        parts = path.parts
        if "uploads" not in parts:
            return None
        relative_path = Path(*parts[parts.index("uploads") + 1:])

    return "/uploads/" + quote(relative_path.as_posix())


def absolute_upload_url(request: Request, file_path: str | None) -> str | None:
    upload_url = get_upload_url(file_path)
    if not upload_url:
        return None
    return str(request.base_url).rstrip("/") + upload_url


def prediction_to_dict(prediction: Prediction) -> dict:
    return {
        "id": prediction.id,
        "status": prediction.status,
        "prediction": prediction.disease,
        "finding": prediction.finding,
        "confidence": prediction.confidence,
        "confidence_score": prediction.confidence_score,
        "detected_bone": prediction.detected_bone,
        "severity": prediction.severity,
        "explanation": prediction.explanation,
        "recovery_guidance": prediction.recovery_guidance,
        "home_care_guidance": prediction.home_care_guidance,
        "warning_guidance": prediction.warning_guidance,
        "summary": prediction.summary,
        "result_image_url": get_upload_url(prediction.result_image_path),
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
    }
