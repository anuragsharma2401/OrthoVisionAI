from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)  

# Get all patients
@router.get("/")
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return patients

# Register new patient
@router.post("/")
def add_patient(patient: PatientCreate, db: Session = Depends(get_db)):

    new_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "message": "Patient Added Successfully",
        "patient_id": new_patient.id
    }