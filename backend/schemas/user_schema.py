from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    smtp_email: Optional[EmailStr] = None
    smtp_password: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DietRecommendationRequest(BaseModel):
    age: int = Field(..., gt=0, le=120)
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    goal: str = Field(..., min_length=3, max_length=50)


class MealCreate(BaseModel):
    food_name: str = Field(..., min_length=2, max_length=120)
    calories: float = Field(..., ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)
    consumed_at: datetime = Field(default_factory=datetime.utcnow)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=80)
    age: Optional[int] = Field(None, gt=0, le=120)
    gender: Optional[str] = Field(None, min_length=2, max_length=30)
    height: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    activity_level: Optional[str] = Field(None, min_length=3, max_length=30)
    goal: Optional[str] = Field(None, min_length=3, max_length=50) # Re-added for Weight Card


class HealthPredictRequest(BaseModel):
    age: int = Field(..., gt=0, le=120)
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)
