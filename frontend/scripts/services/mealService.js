/**
 * MealService — Single Source of Truth for the 7-day Spoonacular meal plan.
 *
 * Cache hierarchy (fastest → slowest, never hits Spoonacular unnecessarily):
 *
 *   1. In-memory (_plan)          — instant, survives hot-reloads
 *   2. sessionStorage              — survives page refresh, TTL = 7 days
 *   3. GET /api/diet/spoonacular-meal-plan
 *        → backend checks MongoDB cache first (TTL = 7 days, fingerprint-keyed)
 *        → backend calls Spoonacular only on cache miss / profile change
 *        → backend serves stale MongoDB cache on 402 / any API error
 *   4. GET /api/meal-plan/stored   — last-resort: plain stored plan, no Spoonacular
 *
 * Components never call Spoonacular directly.  They subscribe here and always
 * receive the same plan object.
 */

const CACHE_KEY    = 'nutriai-meal-plan-cache'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 days — matches backend TTL

// ── Internal state ────────────────────────────────────────────────────────────
let _plan        = null   // { meal_plan: [...], target_calories, goal, ... }
let _loading     = false
let _subscribers = []     // Array of (plan, error) => void

// ── Private helpers ───────────────────────────────────────────────────────────

function _getToken() {
  return localStorage.getItem('nutriai-auth-token')
}

function _loadFromSession() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    // Expire if older than TTL
    if (Date.now() - parsed.cached_at > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    // Also expire if the cache is from a previous calendar day —
    // this ensures the Next Meal card always reads today's fresh plan
    // and never shows yesterday's stale meal names.
    const cachedDate = new Date(parsed.cached_at).toDateString()
    const todayDate  = new Date().toDateString()
    if (cachedDate !== todayDate) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function _saveToSession(plan) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...plan, cached_at: Date.now() }))
  } catch {
    // sessionStorage quota or unavailable — silent fail
  }
}

function _notify(plan, error) {
  for (const cb of _subscribers) {
    try { cb(plan, error) } catch { /* one bad subscriber must not break others */ }
  }
}

/**
 * Last-resort fallback: fetch whatever is stored in MongoDB via the reminder
 * endpoint (no Spoonacular involved at all).
 * Returns the plan data object or null.
 */
async function _fetchStoredPlan(token) {
  try {
    const resp = await fetch('/api/meal-plan/stored', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) return null
    const data = await resp.json()

    // /api/meal-plan/stored returns { success, data: { meal_plan: { monday: {...}, ... } } }
    const raw = data?.data?.meal_plan
    if (!raw || typeof raw !== 'object' || !Object.keys(raw).length) return null

    // Convert the day-keyed dict to the array format the UI expects
    const order = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    const meal_plan = order
      .filter(d => raw[d])
      .map(d => ({
        day:       d.charAt(0).toUpperCase() + d.slice(1),
        breakfast: raw[d].breakfast || '—',
        lunch:     raw[d].lunch     || '—',
        dinner:    raw[d].dinner    || '—',
        nutrition: raw[d].nutrition || {},
      }))

    if (meal_plan.length < 7) return null

    return { meal_plan, target_calories: 0, goal: '', from_cache: true }
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe to meal plan updates.
 * Fires immediately with any in-memory or sessionStorage value, then again
 * whenever the plan is refreshed or invalidated.
 *
 * @param   {function} callback  (plan, error) => void
 * @returns {function}           unsubscribe
 */
export function subscribe(callback) {
  _subscribers.push(callback)

  if (_plan) {
    callback(_plan, null)        // already loaded — fire instantly
  } else {
    fetchPlan()                  // kick off the fetch chain
  }

  return () => {
    _subscribers = _subscribers.filter(cb => cb !== callback)
  }
}

/**
 * Fetch the meal plan using the full cache hierarchy.
 * Concurrent calls are collapsed — only one HTTP request in flight at a time.
 */
export async function fetchPlan() {
  if (_plan)    return _plan          // 1. in-memory hit

  const session = _loadFromSession()
  if (session) {                      // 2. sessionStorage hit
    _plan = session
    _notify(_plan, null)
    return _plan
  }

  if (_loading) return null           // another fetch already in flight
  const token = _getToken()
  if (!token)   return null

  _loading = true

  try {
    // 3. Backend — serves MongoDB cache or calls Spoonacular (never 402 exposed)
    const resp = await fetch('/api/diet/spoonacular-meal-plan', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await resp.json()

    if (data.success && data.data?.meal_plan?.length) {
      _plan = data.data
      _saveToSession(_plan)
      _notify(_plan, null)
      return _plan
    }

    // 4. Last resort: plain stored plan (no Spoonacular)
    console.warn('[mealService] Primary endpoint returned error — trying stored fallback')
    const stored = await _fetchStoredPlan(token)
    if (stored) {
      _plan = stored
      _saveToSession(_plan)
      _notify(_plan, null)
      return _plan
    }

    // All sources exhausted
    const err = data.detail || 'Meal plan temporarily unavailable. Please try again tomorrow.'
    _notify(null, err)
    return null

  } catch {
    // Network error — try stored fallback before giving up
    const stored = await _fetchStoredPlan(_getToken())
    if (stored) {
      _plan = stored
      _saveToSession(_plan)
      _notify(_plan, null)
      return _plan
    }
    _notify(null, 'Could not load meal plan. Check your connection.')
    return null
  } finally {
    _loading = false
  }
}

/**
 * Invalidate all caches and re-fetch.
 * Call after a profile save so every subscriber gets the refreshed plan.
 */
export async function invalidate() {
  _plan    = null
  _loading = false
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ok */ }
  return fetchPlan()
}

/**
 * Synchronously return whatever is currently cached (in-memory or session).
 * Returns null if nothing is loaded yet.
 */
export function getCachedPlan() {
  return _plan || _loadFromSession()
}
