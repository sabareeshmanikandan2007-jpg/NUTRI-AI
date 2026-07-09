import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load .env FIRST — before any other backend module is imported,
# so os.getenv() calls in helpers.py, diet.py, etc. see the real values.
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .routes.auth import router as auth_router
from .routes.diet import router as diet_router
from .routes.profile import router as profile_router
from .routes.progress import router as progress_router
from .routes.reminder import router as reminder_router
from .routes.chat import router as chat_router
from .routes.food import router as food_router
from .scheduler.reminder import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: start/stop background scheduler
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the meal reminder scheduler on startup and stop it on shutdown."""
    logger.info("🚀 Starting AI Diet & Nutrition Planner API...")
    start_scheduler()
    yield
    logger.info("🛑 Shutting down AI Diet & Nutrition Planner API...")
    stop_scheduler()


app = FastAPI(
    title="AI Diet & Nutrition Planner API",
    version="1.1.0",
    description="Backend API for AI-powered diet, nutrition, progress tracking, and automated meal reminders.",
    lifespan=lifespan,
)

allowed_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
)
origin_list = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(diet_router, prefix="/diet")
app.include_router(progress_router)
app.include_router(profile_router)
app.include_router(reminder_router, prefix="/reminder")
app.include_router(food_router, prefix="/food")
app.include_router(chat_router)


@app.get("/")
def root() -> dict:
    return {
        "message": "AI Diet & Nutrition Planner backend is running.",
        "version": "1.1.0",
        "features": [
            "Authentication",
            "Diet Recommendations",
            "Food Analysis",
            "Progress Tracking",
            "Automated Meal Reminders (Email)",
        ],
    }


@app.get("/meal-plan")
def get_meal_plan(calories: int = Query(2100), goal: str = Query("maintain")) -> dict:
    """
    Generate a personalized weekly meal plan based on calories and fitness goal.
    Public endpoint - no authentication required.
    
    Args:
        calories: Daily calorie target (default: 2100)
        goal: Fitness goal - 'weight_loss', 'weight_gain', or 'maintain'
    
    Returns:
        Weekly meal plan with 7 days of meals
    """
    # Meal options based on goal
    meal_options = {
        "weight_loss": {
            "breakfast": [
                "Egg whites with whole wheat toast",
                "Greek yogurt with berries",
                "Oatmeal with almonds",
                "Protein smoothie (low-fat)",
                "Vegetable omelet",
                "Chia pudding with almond milk",
                "Scrambled eggs with spinach",
            ],
            "lunch": [
                "Grilled chicken breast with broccoli and brown rice",
                "Tuna salad with mixed greens",
                "Turkey sandwich on whole wheat",
                "Baked salmon with asparagus",
                "Lentil soup with whole grain bread",
                "Chicken stir-fry with vegetables",
                "Quinoa bowl with grilled chicken",
            ],
            "dinner": [
                "Baked tilapia with roasted vegetables",
                "Lean beef with sweet potato",
                "Tofu stir-fry with brown rice",
                "Grilled chicken with cauliflower rice",
                "Turkey meatballs with zucchini noodles",
                "White fish with steamed broccoli",
                "Chicken breast with green beans",
            ],
        },
        "weight_gain": {
            "breakfast": [
                "Oats with peanut butter and banana",
                "Bagel with cream cheese and eggs",
                "Protein pancakes with syrup",
                "Acai bowl with granola and honey",
                "Avocado toast with whole grain bread",
                "Smoothie bowl with nuts and seeds",
                "Eggs with hash browns and bacon",
            ],
            "lunch": [
                "Burger with fries and shake",
                "Pasta with meat sauce and olive oil",
                "Rice with fried chicken and vegetables",
                "Sandwich with chips and mayo",
                "Burrito bowl with cheese and sour cream",
                "Pizza with extra cheese",
                "Fried rice with chicken and eggs",
            ],
            "dinner": [
                "Pizza with pepperoni and extra cheese",
                "Steak with fries and butter",
                "Creamy pasta with chicken",
                "Fish and chips",
                "Chicken thighs with fried rice",
                "BBQ ribs with mashed potatoes",
                "Salmon with hollandaise sauce and potatoes",
            ],
        },
        "maintain": {
            "breakfast": [
                "Oatmeal with berries and honey",
                "Greek yogurt with granola",
                "Scrambled eggs with whole wheat toast",
                "Smoothie bowl with nuts",
                "Chia pudding with coconut milk",
                "Pancakes with maple syrup",
                "Fruit salad with yogurt",
            ],
            "lunch": [
                "Quinoa salad with chicken and vegetables",
                "Turkey and avocado wrap",
                "Lentil soup with side salad",
                "Grilled chicken bowl with rice",
                "Tuna salad sandwich",
                "Chickpea salad with tahini dressing",
                "Roasted vegetable and tofu bowl",
            ],
            "dinner": [
                "Grilled salmon with roasted potatoes",
                "Stir-fried chicken with vegetables",
                "Tofu curry with rice",
                "Baked cod with seasonal vegetables",
                "Spaghetti with marinara and vegetables",
                "Grilled pork chop with sweet potato",
                "Vegetable lasagna",
            ],
        },
    }

    # Normalize goal format
    goal_normalized = goal.lower().replace(" ", "_")
    if goal_normalized not in meal_options:
        goal_normalized = "maintain"

    meals = meal_options[goal_normalized]
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    # Generate weekly plan
    weekly_plan = []
    for idx, day in enumerate(days):
        weekly_plan.append({
            "day": day,
            "breakfast": meals["breakfast"][idx % len(meals["breakfast"])],
            "lunch": meals["lunch"][idx % len(meals["lunch"])],
            "dinner": meals["dinner"][idx % len(meals["dinner"])],
        })

    return {
        "days": weekly_plan,
        "calories": calories,
        "goal": goal_normalized,
    }
