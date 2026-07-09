from datetime import datetime
import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..database.db import db
from ..schemas.user_schema import ProfileUpdate
from ..utils.helpers import get_current_user_id, response_ok, serialize_doc

router = APIRouter(tags=["Profile"])
logger = logging.getLogger(__name__)

PLACEHOLDER_GENDER_VALUES = {"select gender", "select", "choose", "choose one", ""}


def compute_profile_completed(profile: dict) -> bool:
    required_fields = {
        "name": lambda value: isinstance(value, str) and len(value.strip()) >= 2,
        "age": lambda value: isinstance(value, (int, float)) and value > 0,
        "gender": lambda value: isinstance(value, str)
        and value.strip().lower() not in PLACEHOLDER_GENDER_VALUES,
        "height": lambda value: isinstance(value, (int, float)) and value > 0,
        "weight": lambda value: isinstance(value, (int, float)) and value > 0,
        "activity_level": lambda value: isinstance(value, str) and len(value.strip()) >= 3,
        "goal": lambda value: isinstance(value, str) and len(value.strip()) >= 3,
    }

    for field, validator in required_fields.items():
        if not validator(profile.get(field)):
            return False

    return True


def with_profile_completion(profile: dict) -> dict:
    profile["profile_completed"] = compute_profile_completed(profile)
    return profile


@router.get("/profile")
def get_profile(user_id: str = Depends(get_current_user_id)) -> dict:
    users = db["users"]
    profiles = db["profiles"]

    logger.info(f"📖 Fetching profile for user: {user_id}")

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        logger.error(f"❌ User not found: {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = profiles.find_one({"user_id": ObjectId(user_id)})

    if not profile:
        logger.warning(f"   ⚠️ No profile found for user {user_id}, creating new one...")
        profile = with_profile_completion({
            "user_id": ObjectId(user_id),
            "name": user.get("name", ""),
            "age": None,
            "gender": None,
            "height": None,
            "weight": None,
            "activity_level": "moderate",
            "goal": "balanced",
            "weight_history": [],
            "profile_completed": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        try:
            result = profiles.insert_one(profile)
            logger.info(f"   ✅ New profile created with ID: {result.inserted_id}")
        except Exception as insert_error:
            logger.error(f"   ❌ Failed to create profile: {str(insert_error)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create profile: {str(insert_error)}")
        
        # Fetch the newly created profile
        profile = profiles.find_one({"_id": result.inserted_id})
        logger.info(f"   ✅ Profile retrieved: {profile.get('name', 'Unknown')}")
    else:
        logger.info(f"   ✅ Profile fetched: {profile.get('name', 'Unknown')}")

    profile = with_profile_completion(profile)
    
    return response_ok(message="Profile fetched", data=serialize_doc(profile))


@router.post("/profile/init")
def init_profile(user_id: str = Depends(get_current_user_id)) -> dict:
    """Initialize a profile for a new user if it doesn't exist."""
    users = db["users"]
    profiles = db["profiles"]

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.utcnow()
    # upsert — only sets fields when inserting a brand-new profile
    profiles.update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$setOnInsert": {
                "user_id":          ObjectId(user_id),
                "name":             user.get("name", ""),
                "age":              None,
                "gender":           None,
                "height":           None,
                "weight":           None,
                "activity_level":   "moderate",
                "goal":             "balanced",
                "weight_history":   [],
                "profile_completed": False,
                "created_at":       now,
                "updated_at":       now,
            }
        },
        upsert=True,
    )

    profile = profiles.find_one({"user_id": ObjectId(user_id)})
    return response_ok(message="Profile initialized", data=serialize_doc(profile))


@router.put("/profile")
def update_profile(payload: ProfileUpdate, user_id: str = Depends(get_current_user_id)) -> dict:
    profiles = db["profiles"]
    users = db["users"]

    logger.info(f"📝 Updating profile for user: {user_id}")

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Fetch the existing profile (if any) to merge weight history
    profile = profiles.find_one({"user_id": ObjectId(user_id)})

    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.utcnow()

    # Weight history — append today's value if changed
    weight = updates.get("weight")
    if weight is not None:
        history = (profile or {}).get("weight_history", [])
        today = datetime.utcnow().date().isoformat()
        found = False
        for entry in history:
            if entry.get("date") == today:
                entry["weight"] = weight
                found = True
                break
        if not found:
            history.append({"date": today, "weight": weight})
        updates["weight_history"] = history
        logger.info(f"   Weight updated to {weight}kg for {today}")

    # Compute profile_completed against merged state
    merged = {**(profile or {}), **updates}
    updates["profile_completed"] = compute_profile_completed(merged)

    # Upsert: update if exists, insert if not — safe against the unique index
    result = profiles.update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$set": updates,
            "$setOnInsert": {
                "user_id":    ObjectId(user_id),
                "created_at": datetime.utcnow(),
            },
        },
        upsert=True,
    )

    if result.upserted_id:
        logger.info(f"   ✅ New profile created via upsert (id={result.upserted_id})")
    else:
        logger.info(f"   ✅ Profile updated (modified={result.modified_count})")

    updated_profile = profiles.find_one({"user_id": ObjectId(user_id)})
    updated_profile = with_profile_completion(updated_profile)

    # Trigger immediate meal reminder
    try:
        from ..scheduler.reminder import send_immediate_reminder
        send_immediate_reminder(user_id)
    except Exception as e:
        logger.warning(f"⚠️ Could not send immediate reminder: {e}")

    return response_ok(message="Profile updated successfully", data=serialize_doc(updated_profile))
