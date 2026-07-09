from datetime import datetime
import logging
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from ..database.db import db
from ..utils.helpers import get_current_user_id, response_ok

router = APIRouter(tags=["Food"])
logger = logging.getLogger(__name__)

class MealLog(BaseModel):
    food_name: str
    calories: float
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    meal_type: Optional[str] = "other" # breakfast, lunch, dinner, snack

@router.post("/add-meal")
def add_meal(payload: MealLog, user_id: str = Depends(get_current_user_id)) -> dict:
    meals = db["meals"]
    
    try:
        meal_doc = payload.model_dump()
        meal_doc["user_id"] = ObjectId(user_id)
        meal_doc["consumed_at"] = datetime.utcnow()
        
        result = meals.insert_one(meal_doc)
        
        return response_ok(
            message="Meal added successfully",
            data={"meal_id": str(result.inserted_id)}
        )
    except Exception as e:
        logger.error(f"Error adding meal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add meal"
        )

@router.get("/daily-calories")
def get_daily_calories(
    date: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id)
) -> dict:
    meals = db["meals"]
    
    try:
        if date:
            target_date = datetime.fromisoformat(date).date()
        else:
            target_date = datetime.utcnow().date()
            
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        
        meal_docs = list(meals.find({
            "user_id": ObjectId(user_id),
            "consumed_at": {"$gte": start_dt, "$lte": end_dt}
        }))
        
        total_calories = sum(float(m.get("calories", 0)) for m in meal_docs)
        total_protein = sum(float(m.get("protein", 0)) for m in meal_docs)
        total_carbs = sum(float(m.get("carbs", 0)) for m in meal_docs)
        total_fat = sum(float(m.get("fat", 0)) for m in meal_docs)
        
        return response_ok(
            message="Daily calories fetched",
            data={
                "date": target_date.isoformat(),
                "total_calories": total_calories,
                "total_protein": total_protein,
                "total_carbs": total_carbs,
                "total_fat": total_fat,
                "meals_count": len(meal_docs)
            }
        )
    except Exception as e:
        logger.error(f"Error fetching daily calories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch calories"
        )
