from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prediction import Prediction
from app.services.prediction_service import save_image

router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"]
)


@router.get("/")
def get_predictions(db: Session = Depends(get_db)):
    predictions = db.query(Prediction).all()
    return predictions


@router.post("/upload")
def create_prediction(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Save X-ray image
    image_path = save_image(file)

    # Temporary prediction
    # Later YOLO model will replace this
    disease = "Fracture"
    confidence = "97%"

    # Save prediction in database
    new_prediction = Prediction(
        patient_id=patient_id,
        disease=disease,
        confidence=confidence,
        image_path=image_path
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return {
        "message": "Prediction Saved Successfully",
        "prediction_id": new_prediction.id,
        "patient_id": patient_id,
        "disease": disease,
        "confidence": confidence,
        "image_path": image_path
    }