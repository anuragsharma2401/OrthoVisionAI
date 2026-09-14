from fastapi import FastAPI

from app.db.database import Base, engine

# Import models
from app.models.user import User
from app.models.patient import Patient
from app.models.prediction import Prediction
from app.models.report import Report

# Import routers
from app.routers import user
from app.routers import patient
from app.routers import prediction
from app.routers import upload
# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OrthoVision AI Backend",
    version="1.0.0"
)

# Include routers
app.include_router(user.router)
app.include_router(patient.router)
app.include_router(prediction.router)
app.include_router(upload.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to OrthoVision AI Backend"
    }