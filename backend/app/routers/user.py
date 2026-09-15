from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

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


def serialize_user(user: User):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }
