from datetime import datetime
from pathlib import Path
import sys

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.prediction_service import ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, save_image

REPO_ROOT = Path(__file__).resolve().parents[3]
ML_ROOT = REPO_ROOT / "ml"
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from predictor import predict_xray

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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI model could not analyze this image. Please try again.",
        ) from exc

    confidence_score = ml_result.get("confidence")
    disease = ml_result.get("prediction") or "No detection"
    confidence = (
        f"{confidence_score * 100:.1f}%"
        if isinstance(confidence_score, (int, float))
        else "Not available"
    )
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
        detected_bone=ml_result.get("detected_bone"),
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
            "confidence": confidence,
            "confidence_score": confidence_score,
            "detected_bone": new_prediction.detected_bone,
            "summary": summary,
            "image_path": image_path,
            "result_image_path": new_prediction.result_image_path,
            "detections": ml_result.get("detections", []),
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }
