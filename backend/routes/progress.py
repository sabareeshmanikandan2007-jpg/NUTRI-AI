from collections import defaultdict
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from ..database.db import db
from ..utils.bmi import calculate_bmi
from ..utils.helpers import get_current_user_id, response_ok

router = APIRouter(tags=["Progress"])


def _calc_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor BMR — same formula used in diet.py."""
    g = (gender or "male").lower()
    if g in ("female", "f"):
        return 10 * weight + 6.25 * height - 5 * age - 161
    return 10 * weight + 6.25 * height - 5 * age + 5


def _activity_multiplier(activity_level: str) -> float:
    mapping = {
        "sedentary":         1.2,
        "lightly_active":    1.375,
        "light":             1.375,
        "moderately_active": 1.55,
        "moderate":          1.55,
        "very_active":       1.725,
        "very":              1.725,
        "extra_active":      1.9,
        "super_active":      1.9,
    }
    al = (activity_level or "").lower().replace(" ", "_").replace("-", "_")
    for key, val in mapping.items():
        if key in al:
            return val
    return 1.55  # default


@router.get("/progress")
def get_progress(user_id: str = Depends(get_current_user_id)) -> dict:
    profiles_col = db["profiles"]
    users_col    = db["users"]
    meals_col    = db["meals"]

    profile = profiles_col.find_one({"user_id": ObjectId(user_id)}) or {}
    user    = users_col.find_one({"_id": ObjectId(user_id)}) or {}

    weight_history = profile.get("weight_history", [])
    height  = profile.get("height") or 170
    weight  = profile.get("weight") or 70
    age     = profile.get("age")    or 25
    gender  = profile.get("gender") or "male"
    activity_level = profile.get("activity_level") or "moderately_active"
    goal    = (profile.get("goal") or "balanced").lower()

    # ── BMI trend from weight history ────────────────────────────────────────
    bmi_trend = []
    for entry in weight_history:
        w = entry.get("weight")
        d = entry.get("date")
        if w and d:
            bmi_trend.append({
                "date": d if isinstance(d, str) else str(d),
                "bmi":  calculate_bmi(weight_kg=float(w), height_cm=float(height)),
            })

    # ── Daily TDEE (burn) — same Mifflin-St Jeor formula as /diet/calorie-stats ──
    bmr        = _calc_bmr(weight, height, age, gender)
    multiplier = _activity_multiplier(activity_level)
    tdee       = round(bmr * multiplier)

    # ── Manually logged meal intake (from CalorieTracker) ────────────────────
    start_date = datetime.utcnow().date() - timedelta(days=6)
    start_dt   = datetime.combine(start_date, datetime.min.time())

    meal_docs = list(meals_col.find({
        "user_id":     ObjectId(user_id),
        "consumed_at": {"$gte": start_dt},
    }))

    logged_daily: dict[str, float] = defaultdict(float)
    for meal in meal_docs:
        consumed = meal.get("consumed_at")
        calories = float(meal.get("calories", 0))
        if isinstance(consumed, datetime):
            logged_daily[consumed.date().isoformat()] += calories

    # ── Planned intake from stored meal plan (Spoonacular) ───────────────────
    # Use the meal plan's daily calories as the "planned intake" for days where
    # the user hasn't manually logged anything yet.
    stored_plan: dict = user.get("meal_plan") or {}
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    def _plan_calories_for_date(date_obj) -> int:
        """Return the planned calorie target for a given date from the stored meal plan."""
        day_key = date_obj.strftime("%A").lower()
        day_entry = stored_plan.get(day_key) or {}
        cal = (day_entry.get("nutrition") or {}).get("calories") or 0
        return int(cal)

    # ── Build 7-day calorie_burn array ────────────────────────────────────────
    calorie_burn = []
    calorie_intake_list = []

    for i in range(6, -1, -1):
        date_obj = datetime.utcnow().date() - timedelta(days=i)
        date_str = date_obj.isoformat()

        # Intake: prefer manually logged meals; fall back to planned meal calories
        logged = logged_daily.get(date_str, 0)
        planned = _plan_calories_for_date(date_obj)
        intake = logged if logged > 0 else planned

        calorie_burn.append({
            "date":   date_str,
            "burn":   tdee,
            "intake": intake,
        })
        calorie_intake_list.append({
            "date":     date_str,
            "calories": round(intake, 2),
            "logged":   round(logged, 2),
            "planned":  planned,
        })

    return response_ok(
        message="Progress fetched successfully",
        data={
            "weight_history":  weight_history,
            "bmi_trend":       bmi_trend,
            "calorie_intake":  calorie_intake_list,
            "calorie_burn":    calorie_burn,
            "tdee":            tdee,
        },
    )
