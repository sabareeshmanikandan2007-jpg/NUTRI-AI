import os
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from ..database.db import db
from ..schemas.user_schema import UserLogin, UserRegister
from ..utils.helpers import create_access_token, hash_password, response_ok, verify_password

router = APIRouter(tags=["Auth"])
logger = logging.getLogger(__name__)


@router.post("/register")
def register(payload: UserRegister) -> dict:
    users = db["users"]
    
    try:
        existing = users.find_one({"email": payload.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists",
            )

        now = datetime.utcnow()
        user_doc = {
            "name": payload.name,
            "email": payload.email.lower(),
            "password": hash_password(payload.password),
            "smtp_email": payload.smtp_email,
            "smtp_password": payload.smtp_password,
            "reminder_enabled": True,
            "meal_plan": {},
            "created_at": now,
            "updated_at": now,
        }

        result = users.insert_one(user_doc)
        access_token = create_access_token(
            data={"sub": str(result.inserted_id), "email": payload.email.lower()}
        )

        try:
            from ..scheduler.reminder import send_welcome_email
            send_welcome_email(str(result.inserted_id))
        except Exception:
            pass

        return response_ok(
            message="User registered successfully",
            data={
                "user_id": str(result.inserted_id),
                "email": payload.email.lower(),
                "access_token": access_token,
                "token_type": "bearer",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        ) from e


@router.post("/login")
def login(payload: UserLogin) -> dict:
    users = db["users"]
    
    try:
        user = users.find_one({"email": payload.email.lower()})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(payload.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        access_token = create_access_token(
            data={"sub": str(user["_id"]), "email": user["email"]}
        )
        try:
            from ..scheduler.reminder import send_welcome_email
            send_welcome_email(str(user["_id"]))
        except Exception:
            pass

        return response_ok(
            message="Login successful",
            data={"access_token": access_token, "token_type": "bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed: Database connection error",
        ) from e
