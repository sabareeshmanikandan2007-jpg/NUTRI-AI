import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('../../config/environment/server.env', import.meta.url)) });

const app = express();
const PORT = process.env.PORT || 8787;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
const OPENROUTER_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4-vision';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || OPENROUTER_CHAT_MODEL; // Fallback for compatibility
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ||
  process.env.FASTAPI_URL ||
  'http://localhost:8000';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

const SPOONACULAR_ALLOWED_DIETS = new Set([
  'gluten free',
  'ketogenic',
  'vegetarian',
  'lacto-vegetarian',
  'ovo-vegetarian',
  'vegan',
  'pescetarian',
  'paleo',
  'primal',
  'low fodmap',
  'whole30',
  'low-carb',
]);

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});


async function callFastApi(pathname, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    query,
    headers = {},
  } = options;

  const params = query ? new URLSearchParams(query) : null;
  const queryString = params && params.toString() ? `?${params.toString()}` : '';
  const url = `${FASTAPI_BASE_URL}${pathname}${queryString}`;
  console.log(`Calling FastAPI: ${method} ${pathname}`);

  const requestHeaders = { ...headers };
  if (token) {
    requestHeaders.Authorization = token;
  }

  if (body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      timeout: 30000,
    });

    let payload = null;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = text ? { detail: text } : { detail: 'No content' };
      }
    } catch (parseError) {
      console.error('Error parsing FastAPI response:', parseError.message);
      const text = await response.text().catch(() => '');
      payload = { detail: text || 'Invalid response format' };
    }

    return { ok: response.ok, status: response.status, payload };
  } catch (fetchError) {
    console.error(`FastAPI fetch error for ${pathname}:`, fetchError.message);
    return {
      ok: false,
      status: 503,
      payload: { detail: `Backend service unavailable: ${fetchError.message}` },
    };
  }
}

function sendProxyResult(res, result, fallbackMessage) {
  const status = result.status || 200;

  if (!result.ok) {
    return res.status(Math.max(status, 400)).json({
      detail: result.payload?.detail || fallbackMessage || 'Request failed',
      error: result.payload?.error,
    });
  }

  return res.status(status).json(result.payload || { detail: 'Success' });
}

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NutriAI Backend Proxy</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #f0fdf4; color: #065f46; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
          h1 { margin-top: 0; color: #059669; }
          .status { display: inline-block; padding: 0.25rem 0.75rem; background: #d1fae5; border-radius: 1rem; font-weight: bold; font-size: 0.875rem; color: #065f46; }
          p { color: #374151; line-height: 1.5; }
          .link { display: inline-block; margin-top: 1rem; color: #10b981; text-decoration: none; font-weight: 500; }
          .link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>NutriAI API</h1>
          <div class="status">● Running</div>
          <p>The backend proxy is online and healthy. If you're looking for the application interface, please ensure the frontend server is running on port 5173.</p>
          <a href="/api/health" class="link">View API Health Status &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'online',
    fastapi_base: FASTAPI_BASE_URL,
    model: OPENROUTER_MODEL,
    apiKeyConfigured: Boolean(OPENROUTER_API_KEY),
    spoonacularKeyConfigured: Boolean(SPOONACULAR_API_KEY),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await callFastApi('/auth/register', {
      method: 'POST',
      body: req.body,
    });
    return sendProxyResult(res, result, 'Register request failed');
  } catch (error) {
    console.error('Express Proxy Registration Error:', error);
    return res.status(500).json({ detail: error.message || 'Register request failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await callFastApi('/auth/login', {
      method: 'POST',
      body: req.body,
    });
    return sendProxyResult(res, result, 'Login request failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Login request failed' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const result = await callFastApi('/profile', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Profile fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Profile fetch failed' });
  }
});

app.post('/api/profile/init', async (req, res) => {
  try {
    const result = await callFastApi('/profile/init', {
      method: 'POST',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Profile initialization failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Profile initialization failed' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    console.log('📝 PUT /api/profile - incoming request')
    console.log('Body:', req.body)
    console.log('Auth header:', req.headers.authorization ? `Bearer ${req.headers.authorization.substring(0, 20)}...` : 'missing')

    const result = await callFastApi('/profile', {
      method: 'PUT',
      token: req.headers.authorization,
      body: req.body,
    })

    console.log('Backend result:', { ok: result.ok, status: result.status, detail: result.payload?.detail })
    return sendProxyResult(res, result, 'Profile update failed');
  } catch (error) {
    console.error('❌ PUT /api/profile error:', error.message)
    return res.status(500).json({ detail: error.message || 'Profile update failed' });
  }
});

// ---- Reminder System Routes ----
app.post('/api/toggle-reminder', async (req, res) => {
  try {
    const result = await callFastApi('/reminder/toggle-reminder', {
      method: 'POST',
      token: req.headers.authorization,
      body: req.body,
    });
    return sendProxyResult(res, result, 'Toggle reminder failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Toggle reminder failed' });
  }
});

app.get('/api/reminder-status', async (req, res) => {
  try {
    const result = await callFastApi('/reminder/reminder-status', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Reminder status fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Reminder status fetch failed' });
  }
});

app.post('/api/meal-plan/store', async (req, res) => {
  try {
    const result = await callFastApi('/reminder/meal-plan', {
      method: 'POST',
      token: req.headers.authorization,
      body: req.body,
    });
    return sendProxyResult(res, result, 'Store meal plan failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Store meal plan failed' });
  }
});

app.get('/api/meal-plan/stored', async (req, res) => {
  try {
    const result = await callFastApi('/reminder/meal-plan', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Get meal plan failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Get meal plan failed' });
  }
});

app.post('/api/food/add-meal', async (req, res) => {
  try {
    const result = await callFastApi('/food/add-meal', {
      method: 'POST',
      token: req.headers.authorization,
      body: req.body,
    });
    return sendProxyResult(res, result, 'Add meal failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Add meal failed' });
  }
});

app.get('/api/food/daily-calories', async (req, res) => {
  try {
    const query = {};
    if (req.query?.date) {
      query.date = String(req.query.date);
    }

    const result = await callFastApi('/food/daily-calories', {
      method: 'GET',
      token: req.headers.authorization,
      query,
    });
    return sendProxyResult(res, result, 'Daily calories fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Daily calories fetch failed' });
  }
});

app.get('/api/progress', async (req, res) => {
  try {
    const result = await callFastApi('/progress', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Progress fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Progress fetch failed' });
  }
});

app.post('/api/diet/recommend-diet', async (req, res) => {
  try {
    const result = await callFastApi('/diet/recommend-diet', {
      method: 'POST',
      body: req.body,
    });
    return sendProxyResult(res, result, 'Diet recommendation failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Diet recommendation failed' });
  }
});

app.get('/api/diet/calorie-stats', async (req, res) => {
  try {
    const result = await callFastApi('/diet/calorie-stats', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Calorie stats fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Calorie stats fetch failed' });
  }
});

app.get('/api/diet/spoonacular-meal-plan', async (req, res) => {
  try {
    const result = await callFastApi('/diet/spoonacular-meal-plan', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Spoonacular meal plan fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Spoonacular meal plan fetch failed' });
  }
});

app.post('/api/diet/sync-meal-plan', async (req, res) => {
  try {
    const result = await callFastApi('/diet/sync-meal-plan', {
      method: 'POST',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Meal plan sync failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Meal plan sync failed' });
  }
});

app.get('/api/diet/exercise-plan', async (req, res) => {
  try {
    const result = await callFastApi('/diet/exercise-plan', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Exercise plan fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Exercise plan fetch failed' });
  }
});

app.post('/api/diet/health-predict', async (req, res) => {
  try {
    const result = await callFastApi('/diet/health-predict', {
      method: 'POST',
      body: req.body,
    });
    return sendProxyResult(res, result, 'Health prediction failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Health prediction failed' });
  }
});

app.get('/api/diet/ai-weekly-plan', async (req, res) => {
  try {
    const result = await callFastApi('/diet/ai-weekly-plan', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'AI weekly plan fetch failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'AI weekly plan fetch failed' });
  }
});

app.get('/api/diet/analyze-weight-card', async (req, res) => {
  try {
    const result = await callFastApi('/diet/analyze-weight-card', {
      method: 'GET',
      token: req.headers.authorization,
    });
    return sendProxyResult(res, result, 'Weight card analysis failed');
  } catch (error) {
    return res.status(500).json({ detail: error.message || 'Weight card analysis failed' });
  }
});

app.get('/api/meal-plan', async (req, res) => {
  try {
    const targetCalories = Math.max(1200, Number.parseInt(String(req.query?.calories || '2100'), 10) || 2100);
    const goal = 'maintain';

    console.log(`🍽️  Generating meal plan for goal: ${goal}, calories: ${targetCalories}`);

    // Local meal database - no API keys needed
    const mealDatabase = {
      'maintain': {
        breakfast: ['Oats + berries', 'Greek yogurt', 'Egg toast', 'Smoothie bowl', 'Chia pudding'],
        lunch: ['Quinoa salad', 'Turkey bowl', 'Lentil soup', 'Chicken wrap', 'Rice + beans'],
        dinner: ['Grilled salmon', 'Chicken stir-fry', 'Tofu curry', 'Baked fish', 'Veggie pasta'],
      },
    };

    const meals = mealDatabase[goal];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = weekdays.map((day, index) => ({
      day,
      breakfast: meals.breakfast[index % meals.breakfast.length],
      lunch: meals.lunch[index % meals.lunch.length],
      dinner: meals.dinner[index % meals.dinner.length],
    }));

    console.log(`✅ Meal plan generated for ${goal}`);
    return res.json({ days });
  } catch (error) {
    console.error('❌ Meal plan error:', error.message);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      breakfast: 'Oatmeal with berries',
      lunch: 'Grilled chicken salad',
      dinner: 'Salmon with vegetables',
    }));
    return res.json({ days });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const result = await callFastApi('/chat', {
      method: 'POST',
      body: req.body,
    });
    return sendProxyResult(res, result, 'Chatbot request failed');
  } catch (error) {
    console.error('[/api/chat] Proxy error:', error.message);
    return res.status(500).json({ reply: 'Sorry, AI is not available right now.' });
  }
});

app.listen(PORT, () => {
  console.log(`NutriAI ML server running on http://localhost:${PORT}`);
});
