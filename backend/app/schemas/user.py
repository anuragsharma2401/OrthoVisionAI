from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

    class Config:
        from_attributes = True


class GoogleLoginRequest(BaseModel):
    access_token: str


class ForgotPasswordRequest(BaseModel):
    identifier: str


class OtpRequest(BaseModel):
    identifier: str
    purpose: str = "forgot-password"


class OtpVerifyRequest(BaseModel):
    identifier: str
    otp: str
    purpose: str = "forgot-password"


class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str
    password: str
