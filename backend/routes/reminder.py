"""
Reminder routes for NutriAI
Provides endpoints to toggle email reminders and store/retrieve meal plans.
"""

import logging
from typing import Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from ..database.db import db
from ..utils.helpers import get_current_user_id, response_ok

router = APIRouter(tags=["Reminders"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ToggleReminderRequest(BaseModel):
    """Toggle email reminders on/off for a user."""
    email: Optional[EmailStr] = None   # Optional: if not given, uses authenticated user
    enabled: bool = True


class MealPlanDay(BaseModel):
    breakfast: str = ""
    lunch: str = ""
    dinner: str = ""


class StoreMealPlanRequest(BaseModel):
    """Store a 7-day meal plan for the authenticated user."""
    meal_plan: Dict[str, MealPlanDay] = Field(
        ...,
        description="7-day meal plan keyed by lowercase day name",
    )


# ---------------------------------------------------------------------------
# Toggle Reminder Endpoint
# ---------------------------------------------------------------------------

@router.post("/toggle-reminder")
def toggle_reminder(payload: ToggleReminderRequest, user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Enable or disable email meal reminders for a user.
    If 'email' is provided in the payload, it uses that to find the user.
    Otherwise, it uses the authenticated user's ID.
    """
    users = db["users"]

    try:
        if payload.email:
            # Find user by email
            user = users.find_one({"email": payload.email.lower()})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with email {payload.email} not found",
                )
            filter_query = {"email": payload.email.lower()}
        else:
            # Use authenticated user
            filter_query = {"_id": ObjectId(user_id)}

        result = users.update_one(
            filter_query,
            {"$set": {"reminder_enabled": payload.enabled}},
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        action = "enabled" if payload.enabled else "disabled"
        logger.info(f"🔔 Reminders {action} for user: {filter_query}")

        return response_ok(
            message=f"Meal reminders {action} successfully",
            data={"reminder_enabled": payload.enabled},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Toggle reminder error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle reminder: {str(e)}",
        ) from e


# ---------------------------------------------------------------------------
# Get Reminder Status
# ---------------------------------------------------------------------------

@router.get("/reminder-status")
def get_reminder_status(user_id: str = Depends(get_current_user_id)) -> dict:
    """Get the current reminder status for the authenticated user."""
    users = db["users"]

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return response_ok(
        message="Reminder status fetched",
        data={
            "reminder_enabled": user.get("reminder_enabled", False),
            "email": user.get("email", ""),
        },
    )


# ---------------------------------------------------------------------------
# Store Meal Plan
# ---------------------------------------------------------------------------

@router.post("/meal-plan")
def store_meal_plan(payload: StoreMealPlanRequest, user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Store a 7-day meal plan for the authenticated user.
    This meal plan is used by the reminder system to send personalized emails.
    """
    users = db["users"]

    try:
        # Convert Pydantic models to dicts
        meal_plan_dict = {}
        for day, meals in payload.meal_plan.items():
            day_lower = day.lower().strip()
            meal_plan_dict[day_lower] = meals.model_dump()

        result = users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"meal_plan": meal_plan_dict}},
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        logger.info(f"📋 Meal plan stored for user: {user_id} ({len(meal_plan_dict)} days)")

        return response_ok(
            message="Meal plan stored successfully",
            data={"days_stored": list(meal_plan_dict.keys())},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Store meal plan error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store meal plan: {str(e)}",
        ) from e


# ---------------------------------------------------------------------------
# Get Meal Plan
# ---------------------------------------------------------------------------

@router.get("/meal-plan")
def get_meal_plan(user_id: str = Depends(get_current_user_id)) -> dict:
    """Retrieve the stored meal plan for the authenticated user."""
    users = db["users"]

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    meal_plan = user.get("meal_plan", {})

    return response_ok(
        message="Meal plan fetched",
        data={"meal_plan": meal_plan},
    )
