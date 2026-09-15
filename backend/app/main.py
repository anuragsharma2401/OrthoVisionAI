import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

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
from app.routers import report
from app.routers import upload
# Create all tables
Base.metadata.create_all(bind=engine)


def ensure_prediction_columns():
    statements = [
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS confidence_score DOUBLE PRECISION",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS detected_bone VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'completed'",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS summary VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS result_image_path VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


ensure_prediction_columns()


def ensure_report_columns():
    statements = [
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_name VARCHAR",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'uploaded'",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


ensure_report_columns()

app = FastAPI(
    title="OrthoVision AI Backend",
    version="1.0.0"
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router)
app.include_router(patient.router)
app.include_router(prediction.router)
app.include_router(report.router)
app.include_router(upload.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to OrthoVision AI Backend"
    }
