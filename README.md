# NutriAI — AI Diet & Nutrition Planner

A full-stack AI-powered diet planner that generates personalized 7-day meal plans, tracks daily calories, and sends smart email reminders.

---

## Project Structure

```
AI DIET/
├── backend/                  # Python FastAPI backend
│   ├── api/
│   │   └── server.js         # Express proxy server (port 8787)
│   ├── database/
│   │   └── db.py             # MongoDB connection
│   ├── models/               # ML model (health risk prediction)
│   ├── routes/               # API route handlers
│   │   ├── auth.py           # Register / Login (JWT)
│   │   ├── diet.py           # Meal plan, calorie stats, Spoonacular
│   │   ├── food.py           # Meal logging
│   │   ├── profile.py        # User profile CRUD
│   │   ├── progress.py       # 7-day calorie burn/intake chart
│   │   ├── reminder.py       # Email reminder toggle/status
│   │   └── chat.py           # AI chat (OpenRouter)
│   ├── scheduler/
│   │   └── reminder.py       # APScheduler — breakfast/lunch/dinner emails
│   ├── schemas/              # Pydantic schemas
│   ├── utils/                # BMI, email, helpers
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt      # Pinned Python dependencies
│   └── .env.example          # Backend env template
├── frontend/                 # React + Vite frontend
│   ├── components/           # UI components
│   ├── pages/                # Page views
│   ├── scripts/
│   │   └── services/
│   │       └── mealService.js  # Single source of truth for meal plan
│   └── index.html
├── config/
│   ├── vite.config.js        # Vite build config
│   ├── eslint.config.js      # ESLint config
│   ├── environment/
│   │   ├── server.env.example  # Express server env template
│   │   └── .env.example        # Root env template
│   └── scripts/
│       └── start-mongodb.ps1   # MongoDB startup helper
├── data/                     # MongoDB data dir (gitignored)
├── Procfile                  # Render/Railway deployment
├── start.ps1                 # Windows one-command startup
├── start.sh                  # Linux/macOS one-command startup
├── package.json              # Node dependencies
└── .env.example              # Root env template
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| MongoDB | 6+ | Must be installed locally |
| npm | 9+ | Bundled with Node.js |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-diet.git
cd ai-diet
```

### 2. Configure environment variables

Copy each example file and fill in your real values:

```bash
# Backend (FastAPI)
copy backend\.env.example backend\.env

# Express proxy
copy config\environment\server.env.example config\environment\server.env
```

**Keys you need:**

| Key | Where to get it |
|---|---|
| `SPOONACULAR_API_KEY` | [spoonacular.com/food-api](https://spoonacular.com/food-api) — free tier |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) — free credits available |
| `JWT_SECRET_KEY` | Run: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SMTP_EMAIL` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password — [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| `MONGODB_URI` | `mongodb://localhost:27017/` for local MongoDB |

### 3. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Install Node dependencies

```bash
npm install
```

---

## Running Locally

### Windows — one command

```powershell
.\start.ps1
```

### Linux / macOS — one command

```bash
bash start.sh
```

### Manual (run each in a separate terminal)

```bash
# Terminal 1 — MongoDB
mongod --dbpath ./data --port 27017

# Terminal 2 — FastAPI backend
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 3 — Express proxy
cd backend && node api/server.js

# Terminal 4 — Vite frontend
npm run dev
```

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Express Proxy | http://localhost:8787 |
| FastAPI | http://127.0.0.1:8000 |
| API Docs (Swagger) | http://127.0.0.1:8000/docs |
| MongoDB | localhost:27017 |

---

## Building for Production

```bash
# Build the React frontend
npm run build
# Output goes to: dist/
```

The `dist/` folder can be served by any static host (Netlify, Vercel, GitHub Pages).

---

## Deploying to Render

The project is ready for [Render](https://render.com) deployment.

### FastAPI service

| Setting | Value |
|---|---|
| Environment | Python 3 |
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| Root Directory | `.` (project root) |

Set all keys from `backend/.env.example` as **Environment Variables** in the Render dashboard. For MongoDB, use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and set `MONGODB_URI` to your Atlas connection string.

### Frontend (static site)

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Update `config/environment/server.env` `FASTAPI_BASE_URL` to point to your deployed FastAPI URL.

---

## Features

- **7-Day Meal Plan** — personalized via Spoonacular API, cached in MongoDB (7-day TTL)
- **Daily Calorie Chart** — BMR × activity multiplier vs. planned/logged intake
- **Next Meal Card** — real-time next meal from the stored plan
- **Email Reminders** — breakfast (9 AM), lunch (1 PM), dinner (8 PM) IST via SMTP
- **Calorie Tracker** — manual food logging with nutrition breakdown
- **AI Chat** — diet advice via OpenRouter (GPT-4o-mini)
- **Progress Tracking** — weight history, BMI trend, 7-day calorie chart
- **Profile-based** — all plans regenerate automatically when profile changes

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Diet
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/diet/spoonacular-meal-plan` | Fetch 7-day meal plan (cached) |
| POST | `/api/diet/sync-meal-plan` | Regenerate + save meal plan |
| GET | `/api/diet/calorie-stats` | BMR, TDEE, BMI, goal calories |
| GET | `/api/diet/exercise-plan` | 7-day exercise plan |

### Profile & Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile + trigger reminder |
| GET | `/api/progress` | 7-day calorie burn vs intake |

### Food
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/food/add-meal` | Log a meal |
| GET | `/api/food/daily-calories` | Today's logged calories |

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB_NAME` | Yes | Database name (`ai_diet_planner`) |
| `SPOONACULAR_API_KEY` | Yes | Meal plan generation |
| `OPENROUTER_API_KEY` | Yes | AI chat responses |
| `JWT_SECRET_KEY` | Yes | Token signing secret |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP port (587) |
| `SMTP_EMAIL` | Yes | Sender email address |
| `SMTP_PASSWORD` | Yes | Gmail App Password |

### `config/environment/server.env`

| Variable | Required | Description |
|---|---|---|
| `SPOONACULAR_API_KEY` | Yes | Meal plan (Express proxy) |
| `OPENROUTER_API_KEY` | Yes | AI chat (Express proxy) |
| `PORT` | No | Express port (default 8787) |
| `FASTAPI_BASE_URL` | No | FastAPI URL (default http://127.0.0.1:8000) |

---

## License

MIT
#   N U T R I - A I  
 #   N U T R I - A I  
 #   N U T R I - A I  
 