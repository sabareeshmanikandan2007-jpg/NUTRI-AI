import os
import requests
import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..models.ml_model import predict_health_risk
from ..schemas.user_schema import DietRecommendationRequest, HealthPredictRequest
from ..utils.bmi import bmi_category, calculate_bmi
from ..utils.helpers import response_ok, get_current_user_id
from ..database.db import db
from bson import ObjectId

router = APIRouter(tags=["Diet"])
logger = logging.getLogger(__name__)

# How long a cached plan is considered fresh — 7 days
MEAL_PLAN_TTL_DAYS = 7

class AIPlanRequest(BaseModel):
    goal: str # weight loss, weight gain, balanced


def calculate_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor Equation for BMR."""
    gender_lower = (gender or "male").lower()
    if gender_lower in ("female", "f"):
        return 10 * weight + 6.25 * height - 5 * age - 161
    else:
        return 10 * weight + 6.25 * height - 5 * age + 5


def get_activity_multiplier(activity_level: str) -> float:
    activity = (activity_level or "").lower().replace(" ", "_").replace("-", "_")
    multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "light": 1.375,
        "moderately_active": 1.55,
        "moderate": 1.55,
        "very_active": 1.725,
        "very": 1.725,
        "extra_active": 1.9,
        "super_active": 1.9,
    }
    for key, val in multipliers.items():
        if key in activity:
            return val
    return 1.55  # default moderate


@router.get("/calorie-stats")
def get_calorie_stats(user_id: str = Depends(get_current_user_id)):
    """Return daily calorie burned estimates for weight loss, balanced, and weight gain goals."""
    profiles = db["profiles"]
    profile = profiles.find_one({"user_id": ObjectId(user_id)}) or {}

    weight = profile.get("weight") or 70
    height = profile.get("height") or 170
    age = profile.get("age") or 25
    gender = profile.get("gender") or "male"
    activity_level = profile.get("activity_level") or "moderately_active"
    bmi = calculate_bmi(weight, height)
    category = bmi_category(bmi)

    bmr = calculate_bmr(weight, height, age, gender)
    multiplier = get_activity_multiplier(activity_level)
    tdee = round(bmr * multiplier)
    activity_calories = round(tdee - bmr)

    return response_ok(
        message="Calorie stats calculated",
        data={
            "bmi": round(bmi, 1),
            "bmi_category": category,
            "bmr": round(bmr),
            "tdee": tdee,
            "activity_calories": activity_calories,
            "activity_level": activity_level,
            "user_goal": profile.get("goal") or "balanced",
            "goals": {
                "weight_loss": {
                    "label": "Weight Loss",
                    "daily_calories": max(1200, tdee - 500),
                    "description": "500 kcal deficit – lose ~0.5 kg/week",
                },
                "balanced": {
                    "label": "Balanced",
                    "daily_calories": tdee,
                    "description": "Maintenance – keep current weight",
                },
                "weight_gain": {
                    "label": "Weight Gain",
                    "daily_calories": tdee + 500,
                    "description": "500 kcal surplus – gain ~0.5 kg/week",
                },
            },
        },
    )


@router.get("/spoonacular-meal-plan")
def get_spoonacular_meal_plan(user_id: str = Depends(get_current_user_id)):
    """Return 7-day meal plan. Serves MongoDB cache when fresh; calls Spoonacular only when stale."""
    return _generate_and_optionally_store(user_id, store=False, force=False)


@router.post("/sync-meal-plan")
def sync_meal_plan(user_id: str = Depends(get_current_user_id)):
    """
    Called on every profile save. Uses the cache if the profile fingerprint
    hasn't changed; calls Spoonacular only when goal/calories actually changed.
    Always persists the resulting plan to users.meal_plan.
    """
    return _generate_and_optionally_store(user_id, store=True, force=False)


def _build_profile_fingerprint(goal: str, target_calories: int) -> str:
    """
    A cheap string that changes whenever the relevant profile fields change.
    If the fingerprint matches the stored one the cached plan is still valid.
    """
    return f"{goal.lower().strip()}:{target_calories}"


def _get_cached_plan_from_db(user_id: str) -> dict | None:
    """
    Return the stored meal plan from MongoDB if it is still fresh (≤ MEAL_PLAN_TTL_DAYS).
    A plan that has no cached_at (e.g. seeded manually) is treated as fresh.
    Returns None only when the plan is missing, incomplete, or genuinely expired.
    """
    users_col = db["users"]
    user = users_col.find_one(
        {"_id": ObjectId(user_id)},
        {"meal_plan": 1, "meal_plan_cached_at": 1,
         "meal_plan_target_calories": 1, "meal_plan_goal": 1},
    )
    if not user:
        return None

    meal_plan_dict = user.get("meal_plan") or {}
    if not meal_plan_dict or len(meal_plan_dict) < 7:
        return None  # Incomplete or empty

    cached_at = user.get("meal_plan_cached_at")
    if cached_at:
        # Has a timestamp — check TTL
        age = datetime.now(timezone.utc) - cached_at.replace(tzinfo=timezone.utc)
        if age > timedelta(days=MEAL_PLAN_TTL_DAYS):
            logger.info(f"🕐 Meal plan cache expired for {user_id} (age={age.days}d)")
            return None
    # No cached_at = seeded/migrated plan, treat as fresh until first API refresh

    return _build_plan_response(user)


def _build_plan_response(user: dict) -> dict | None:
    """Convert a MongoDB user doc with meal_plan dict into the list-format response."""
    meal_plan_dict = user.get("meal_plan") or {}
    days_order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    meal_plan_list = []
    for day_key in days_order:
        entry = meal_plan_dict.get(day_key, {})
        if not entry:
            return None  # Missing a day — cache is incomplete
        meal_plan_list.append({
            "day":       day_key.capitalize(),
            "breakfast": entry.get("breakfast", "—"),
            "lunch":     entry.get("lunch", "—"),
            "dinner":    entry.get("dinner", "—"),
            "nutrition": entry.get("nutrition", {}),
        })
    return {
        "meal_plan":       meal_plan_list,
        "target_calories": user.get("meal_plan_target_calories", 0),
        "goal":            user.get("meal_plan_goal", ""),
        "from_cache":      True,
    }


def _generate_and_optionally_store(user_id: str, store: bool, force: bool = False):
    """
    Core logic shared by GET /spoonacular-meal-plan and POST /sync-meal-plan.

    Cache strategy:
      1. Load profile + compute target_calories + fingerprint.
      2. If not force and cache exists in MongoDB and fingerprint matches → return cache.
      3. Otherwise call Spoonacular, parse response, store result in MongoDB.

    This means Spoonacular is called AT MOST once per 7 days per user,
    and never more than once per profile-change event.
    """
    spoonacular_api_key = os.getenv("SPOONACULAR_API_KEY")
    if not spoonacular_api_key:
        return {"ok": False, "detail": "Spoonacular API key not configured"}

    profiles = db["profiles"]
    profile = profiles.find_one({"user_id": ObjectId(user_id)}) or {}

    weight = profile.get("weight") or 70
    height = profile.get("height") or 170
    age    = profile.get("age") or 25
    gender = profile.get("gender") or "male"
    activity_level = profile.get("activity_level") or "moderately_active"
    goal   = profile.get("goal") or "balanced"

    bmr = calculate_bmr(weight, height, age, gender)
    multiplier = get_activity_multiplier(activity_level)
    tdee = round(bmr * multiplier)

    goal_lower = goal.lower()
    if "loss" in goal_lower:
        target_calories = max(1200, tdee - 500)
    elif "gain" in goal_lower:
        target_calories = tdee + 500
    else:
        target_calories = tdee

    fingerprint = _build_profile_fingerprint(goal, target_calories)

    # ── Step 1: Check MongoDB cache ─────────────────────────────────────────
    if not force:
        users_col = db["users"]
        user_doc = users_col.find_one(
            {"_id": ObjectId(user_id)},
            {"meal_plan_fingerprint": 1, "meal_plan_cached_at": 1, "meal_plan": 1},
        )
        stored_fingerprint = (user_doc or {}).get("meal_plan_fingerprint", "")
        has_cached_at      = bool((user_doc or {}).get("meal_plan_cached_at"))
        has_plan           = len((user_doc or {}).get("meal_plan") or {}) >= 7

        # Accept cache when:
        #   a) fingerprint matches (profile unchanged), OR
        #   b) plan was seeded/migrated without cached_at metadata (treat as fresh)
        fingerprint_ok = (stored_fingerprint == fingerprint) or (has_plan and not has_cached_at)

        if fingerprint_ok:
            cached = _get_cached_plan_from_db(user_id)
            if cached:
                logger.info(f"✅ Serving meal plan from MongoDB cache for {user_id}")
                return response_ok(
                    message="Meal plan served from cache",
                    data=cached,
                )
            logger.info(f"🔄 Cache miss (expired/incomplete) for {user_id} — calling Spoonacular")
        else:
            logger.info(
                f"🔄 Profile changed for {user_id} "
                f"('{stored_fingerprint}' → '{fingerprint}') — regenerating plan"
            )

    # ── Step 2: Call Spoonacular API ────────────────────────────────────────
    params: dict = {
        "apiKey": spoonacular_api_key,
        "timeFrame": "week",
        "targetCalories": target_calories,
    }

    try:
        resp = requests.get(
            "https://api.spoonacular.com/mealplanner/generate",
            params=params,
            timeout=20,
        )

        # If we hit the 402 quota limit, try serving stale cache as a fallback
        if resp.status_code == 402:
            logger.warning(f"⚠️ Spoonacular quota exceeded for {user_id} — trying stale cache")
            stale = _get_stale_plan_from_db(user_id)
            if stale:
                logger.info(f"✅ Serving stale cache as fallback for {user_id}")
                return response_ok(message="Meal plan served from cache (quota exceeded)", data=stale)
            # No cache at all — return a meaningful error without the raw API response
            return {
                "ok": False,
                "detail": (
                    "Your meal plan could not be refreshed right now because the daily API "
                    "quota has been reached. Your existing plan will be shown if available. "
                    "The plan refreshes automatically tomorrow."
                ),
            }

        resp.raise_for_status()
        spoon_data = resp.json()

        days_order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        days_raw = spoon_data.get("week", {})
        meal_plan = []

        for day_key in days_order:
            day_info  = days_raw.get(day_key, {})
            day_meals = day_info.get("meals", [])
            nutrients = day_info.get("nutrients", {})

            def get_title(idx, meals=day_meals):
                return meals[idx].get("title", "—") if idx < len(meals) else "—"

            meal_plan.append({
                "day": day_key.capitalize(),
                "breakfast": get_title(0),
                "lunch":     get_title(1),
                "dinner":    get_title(2),
                "nutrition": {
                    "calories":      round(nutrients.get("calories", 0)),
                    "protein":       round(nutrients.get("protein", 0), 1),
                    "fat":           round(nutrients.get("fat", 0), 1),
                    "carbohydrates": round(nutrients.get("carbohydrates", 0), 1),
                },
            })

        # ── Step 3: Always persist fresh plan to MongoDB ────────────────────
        plan_for_db = {}
        for entry in meal_plan:
            day_lower = entry["day"].lower()
            plan_for_db[day_lower] = {
                "breakfast": entry["breakfast"],
                "lunch":     entry["lunch"],
                "dinner":    entry["dinner"],
                "nutrition": entry["nutrition"],
            }

        users_col = db["users"]
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "meal_plan":                  plan_for_db,
                "meal_plan_cached_at":        datetime.now(timezone.utc),
                "meal_plan_fingerprint":      fingerprint,
                "meal_plan_target_calories":  target_calories,
                "meal_plan_goal":             goal,
            }},
        )
        logger.info(f"💾 Meal plan cached to MongoDB for {user_id} (fingerprint={fingerprint})")

        return response_ok(
            message="Spoonacular meal plan generated",
            data={
                "meal_plan":       meal_plan,
                "target_calories": target_calories,
                "goal":            goal,
                "stored":          True,
                "from_cache":      False,
            },
        )

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else "?"
        body = e.response.text[:300] if e.response is not None else str(e)
        # Try stale fallback before returning an error
        stale = _get_stale_plan_from_db(user_id)
        if stale:
            return response_ok(message="Meal plan served from cache (API error)", data=stale)
        return {"ok": False, "detail": f"Spoonacular API error {status_code}: {body}"}
    except Exception as e:
        stale = _get_stale_plan_from_db(user_id)
        if stale:
            return response_ok(message="Meal plan served from cache (API error)", data=stale)
        return {"ok": False, "detail": f"Failed to fetch meal plan: {str(e)}"}


def _get_stale_plan_from_db(user_id: str) -> dict | None:
    """
    Return any stored plan regardless of age (used as fallback when API fails).
    Returns None only when no complete plan has ever been stored.
    """
    users_col = db["users"]
    user = users_col.find_one(
        {"_id": ObjectId(user_id)},
        {"meal_plan": 1, "meal_plan_target_calories": 1, "meal_plan_goal": 1},
    )
    if not user:
        return None
    meal_plan_dict = user.get("meal_plan") or {}
    if not meal_plan_dict or len(meal_plan_dict) < 7:
        return None
    return _build_plan_response(user)


# ---------------------------------------------------------------------------
# Exercise plan — deterministic, profile-based, no external API needed
# ---------------------------------------------------------------------------
EXERCISE_PLANS = {
    "weight_loss": [
        {"day": "Monday", "routine": "30 min brisk walk + 20 min HIIT circuits", "estimated_burn": 400},
        {"day": "Tuesday", "routine": "45 min cardio (cycling/running) + core work", "estimated_burn": 450},
        {"day": "Wednesday", "routine": "Full-body strength training (bodyweight)", "estimated_burn": 320},
        {"day": "Thursday", "routine": "30 min jog + 15 min jump rope", "estimated_burn": 420},
        {"day": "Friday", "routine": "Zumba / dance cardio 45 min", "estimated_burn": 380},
        {"day": "Saturday", "routine": "Long walk 60 min + yoga 20 min", "estimated_burn": 300},
        {"day": "Sunday", "routine": "Active rest – light stretching, 20 min walk", "estimated_burn": 150},
    ],
    "weight_gain": [
        {"day": "Monday", "routine": "Heavy compound lifts: Squat, Bench, Row", "estimated_burn": 280},
        {"day": "Tuesday", "routine": "Pull day: Deadlifts, pull-ups, bicep curls", "estimated_burn": 260},
        {"day": "Wednesday", "routine": "Rest or 20 min light walk", "estimated_burn": 100},
        {"day": "Thursday", "routine": "Push day: Overhead press, dips, tricep extensions", "estimated_burn": 260},
        {"day": "Friday", "routine": "Leg day: Squats, lunges, leg press, calf raises", "estimated_burn": 300},
        {"day": "Saturday", "routine": "Full body hypertrophy: 3 sets x 10 reps all major muscles", "estimated_burn": 270},
        {"day": "Sunday", "routine": "Active rest – foam rolling, mobility work", "estimated_burn": 80},
    ],
    "balanced": [
        {"day": "Monday", "routine": "30 min jog + 20 min strength training", "estimated_burn": 350},
        {"day": "Tuesday", "routine": "Yoga + core strengthening 40 min", "estimated_burn": 220},
        {"day": "Wednesday", "routine": "Cycling or swimming 40 min", "estimated_burn": 360},
        {"day": "Thursday", "routine": "Full body resistance training 45 min", "estimated_burn": 300},
        {"day": "Friday", "routine": "30 min brisk walk + stretching", "estimated_burn": 200},
        {"day": "Saturday", "routine": "Recreational sport or group fitness class", "estimated_burn": 380},
        {"day": "Sunday", "routine": "Rest – light stretching, meditation", "estimated_burn": 80},
    ],
}


@router.get("/exercise-plan")
def get_exercise_plan(user_id: str = Depends(get_current_user_id)):
    """Return a 7-day exercise plan tailored to the user's fitness goal."""
    profiles = db["profiles"]
    profile = profiles.find_one({"user_id": ObjectId(user_id)}) or {}

    goal = (profile.get("goal") or "balanced").lower()
    # Normalise goal string
    if "loss" in goal:
        key = "weight_loss"
    elif "gain" in goal:
        key = "weight_gain"
    else:
        key = "balanced"

    plan = EXERCISE_PLANS[key]

    return response_ok(
        message="Exercise plan generated",
        data={"exercise_plan": plan, "goal": key},
    )

@router.get("/ai-weekly-plan")
async def get_ai_weekly_plan(user_id: str = Depends(get_current_user_id)):
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        return {"error": "AI service not configured"}

    profiles = db["profiles"]
    profile = profiles.find_one({"user_id": ObjectId(user_id)})
    
    if not profile:
        return {"error": "Profile not found"}

    user_stats = {
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "height": profile.get("height"),
        "weight": profile.get("weight"),
        "activity_level": profile.get("activity_level"),
        "goal": profile.get("goal", "balanced")
    }

    prompt = f"""
    Generate a 7-day meal plan and exercise recommendation for a user with these stats:
    Age: {user_stats['age']}, Gender: {user_stats['gender']}, Height: {user_stats['height']}cm, 
    Weight: {user_stats['weight']}kg, Activity Level: {user_stats['activity_level']}, 
    Goal (Weight Card): {user_stats['goal']}.

    The response MUST be tailored to the goal '{user_stats['goal']}'.
    - If 'weight loss', focus on calorie deficit and cardio/strength.
    - If 'weight gain', focus on calorie surplus and muscle building.
    - If 'balanced', focus on maintenance and overall health.

    Return ONLY a JSON object with this structure:
    {{
      "meal_plan": [
        {{ "day": "Monday", "breakfast": "...", "lunch": "...", "dinner": "...", "nutrition": {{ "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }} }},
        ...
      ],
      "exercises": [
        {{ "day": "Monday", "routine": "...", "estimated_burn": 0 }},
        ...
      ]
    }}
    """

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json"
    }
    
    body = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a professional nutritionist and fitness coach. Provide responses in valid JSON only. Do not include markdown code blocks."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=20)
        response.raise_for_status()
        data = response.json()
        
        if "choices" in data:
            content = data["choices"][0]["message"]["content"].strip()
            
            # More robust JSON extraction
            try:
                # Remove markdown code blocks if present
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                plan_data = json.loads(content.strip())
                return response_ok(message="AI plan generated", data=plan_data)
            except json.JSONDecodeError:
                # If JSON fails, try to find the first { and last }
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1:
                    plan_data = json.loads(content[start:end+1])
                    return response_ok(message="AI plan generated", data=plan_data)
                raise Exception("Model returned invalid JSON format")
        else:
            error_msg = data.get("error", {}).get("message", "Unknown OpenRouter error")
            return {"error": f"OpenRouter Error: {error_msg}", "ok": False}
            
    except Exception as e:
        print(f"❌ AI Plan Error: {str(e)}")
        return {"error": f"Failed to generate AI plan: {str(e)}", "ok": False}

@router.get("/analyze-weight-card")
async def analyze_weight_card(user_id: str = Depends(get_current_user_id)):
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        return {"error": "AI service not configured"}

    profiles = db["profiles"]
    profile = profiles.find_one({"user_id": ObjectId(user_id)})
    
    if not profile:
        return {"error": "Profile not found"}

    bmi = calculate_bmi(profile['weight'], profile['height'])
    
    prompt = f"""
    Analyze the following user stats and recommend a 'Weight Card' goal (one of: weight gain, balanced, weight loss).
    Age: {profile.get('age')}, Gender: {profile.get('gender')}, Height: {profile.get('height')}cm, 
    Weight: {profile.get('weight')}kg, Activity Level: {profile.get('activity_level')}, BMI: {bmi:.1f}.

    Return ONLY a JSON object:
    {{
      "recommended_goal": "weight loss | weight gain | balanced",
      "reason": "..."
    }}
    """

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json"
    }
    
    body = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            { "role": "user", "content": prompt }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        data = response.json()
        if "choices" in data:
            content = data["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            plan_data = json.loads(content.strip())
            return response_ok(message="Weight card analysis complete", data=plan_data)
    except Exception as e:
        return {"error": str(e)}

def build_diet_plan(goal: str, category: str) -> dict:
    goal_normalized = goal.lower().strip()

    plan_map = {
        "underweight": {
            "breakfast": "Peanut butter oats with banana and milk",
            "lunch": "Rice, grilled chicken, mixed vegetables, yogurt",
            "dinner": "Salmon, sweet potato, avocado salad",
            "calories": 2800,
        },
        "normal": {
            "breakfast": "Oatmeal, boiled eggs, seasonal fruit",
            "lunch": "Brown rice, lentils, grilled paneer/chicken, salad",
            "dinner": "Whole wheat chapati, mixed veggies, tofu/chicken soup",
            "calories": 2200,
        },
        "overweight": {
            "breakfast": "Greek yogurt, berries, chia seeds",
            "lunch": "Quinoa salad with lean protein and greens",
            "dinner": "Steamed fish/chicken with broccoli and soup",
            "calories": 1800,
        },
        "obese": {
            "breakfast": "Vegetable omelet with herbal tea",
            "lunch": "Large salad bowl with chickpeas/chicken",
            "dinner": "Stir-fried vegetables with tofu and clear soup",
            "calories": 1500,
        },
    }

    plan = plan_map.get(category, plan_map["normal"]).copy()

    if "gain" in goal_normalized:
        plan["calories"] += 250
        plan["breakfast"] += " + peanut smoothie"
    elif "loss" in goal_normalized:
        plan["calories"] = max(1300, plan["calories"] - 250)
        plan["dinner"] = "Vegetable soup and grilled protein bowl"
    elif "maintain" in goal_normalized:
        plan["calories"] = int(plan["calories"])

    return plan


@router.post("/recommend-diet")
def recommend_diet(payload: DietRecommendationRequest) -> dict:
    bmi_value = calculate_bmi(weight_kg=payload.weight, height_cm=payload.height)
    category = bmi_category(bmi_value)
    plan = build_diet_plan(payload.goal, category)

    return response_ok(
        message="Diet recommendation generated",
        data={
            "age": payload.age,
            "height": payload.height,
            "weight": payload.weight,
            "goal": payload.goal,
            "bmi": bmi_value,
            "bmi_category": category,
            "diet_plan": plan,
        },
    )


@router.post("/health-predict")
def health_predict(payload: HealthPredictRequest) -> dict:
    prediction = predict_health_risk(
        age=payload.age,
        height=payload.height,
        weight=payload.weight,
    )
    return response_ok(
        message="Health prediction generated",
        data=prediction,
    )
