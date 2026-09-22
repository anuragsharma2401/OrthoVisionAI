import os
import secrets

from fastapi import APIRouter, Depends, HTTPException
import requests
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    OtpRequest,
    OtpVerifyRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
)
from app.services.email_service import send_password_reset_otp
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.otp_service import consume_verified_otp, create_otp, verify_otp

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return users


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": serialize_user(current_user)
    }


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})

    return {
        "message": "User Registered Successfully",
        "user_id": new_user.id,
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(new_user),
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({"sub": str(db_user.id), "email": db_user.email})

    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(db_user)
    }


@router.post("/google-login")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    google_user = fetch_google_user(payload.access_token)
    email = google_user.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Google account email was not returned")

    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        db_user = User(
            full_name=google_user.get("name") or email.split("@")[0],
            email=email,
            password=hash_password(secrets.token_urlsafe(32)),
            role="user",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id), "email": db_user.email})

    return {
        "message": "Google Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(db_user),
    }


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip().lower()
    db_user = db.query(User).filter(User.email == identifier).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="No account found for this email")

    otp = create_otp(identifier, "forgot-password")

    try:
        send_password_reset_otp(db_user.email, otp)
    except Exception as exc:
        if os.getenv("AUTH_DEV_RETURN_OTP", "false").lower() == "true":
            return {
                "message": "Password reset OTP generated. Email sending is not configured.",
                "dev_otp": otp,
            }
        raise HTTPException(
            status_code=503,
            detail="Could not send password reset OTP. Check SMTP configuration.",
        ) from exc

    return {"message": "Password reset OTP sent to your email."}


@router.post("/otp/send")
def send_otp(payload: OtpRequest, db: Session = Depends(get_db)):
    return forgot_password(ForgotPasswordRequest(identifier=payload.identifier), db)


@router.post("/otp/resend")
def resend_otp(payload: OtpRequest, db: Session = Depends(get_db)):
    return send_otp(payload, db)


@router.post("/otp/verify")
def verify_otp_endpoint(payload: OtpVerifyRequest):
    if not verify_otp(payload.identifier, payload.purpose, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"message": "OTP verified successfully."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip().lower()

    if not consume_verified_otp(identifier, "forgot-password", payload.otp):
        raise HTTPException(status_code=400, detail="Verify a valid OTP before resetting password")

    db_user = db.query(User).filter(User.email == identifier).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="No account found for this email")

    db_user.password = hash_password(payload.password)
    db.commit()

    return {"message": "Password reset successfully. Please login with your new password."}


def fetch_google_user(access_token: str):
    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Google authentication failed")

    google_user = response.json()
    expected_client_id = os.getenv("GOOGLE_CLIENT_ID")
    audience = google_user.get("aud")

    if audience and expected_client_id and audience != expected_client_id:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")

    return google_user


def serialize_user(user: User):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }
