/**
 * mealScheduler.js
 *
 * Determines the "next meal" from a 7-day plan array using the device's
 * local date and time.  The plan array uses full day names (Monday … Sunday)
 * as returned by the Spoonacular endpoint.
 *
 * Meal schedule
 * ─────────────
 *   Breakfast  08:00
 *   Lunch      13:00
 *   Dinner     19:00
 *
 * After today's last meal (dinner ≥ 19:00) the next meal is tomorrow's
 * breakfast, with the real meal name from the plan — never a hardcoded string.
 */

// Full day names as returned by the backend (Monday … Sunday, Mon=index 0)
const PLAN_DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// Maps JS Date.getDay() (0 = Sunday) to the plan array index (0 = Monday)
function jsDayToPlanIndex(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1
}

// Meal time windows and display times
// cutoffHour: the meal is "upcoming" if current hour < cutoffHour
//   Breakfast → shown from 00:00 until 13:00 (1 PM)
//   Lunch     → shown from 13:00 until 19:00 (7 PM)
//   Dinner    → shown from 19:00 until 24:00 (midnight)
const MEAL_SCHEDULE = [
  { type: 'breakfast', field: 'breakfast', startHour: 0,  cutoffHour: 13, displayTime: '8:00 AM' },
  { type: 'lunch',     field: 'lunch',     startHour: 13, cutoffHour: 19, displayTime: '1:00 PM' },
  { type: 'dinner',    field: 'dinner',    startHour: 19, cutoffHour: 24, displayTime: '7:00 PM' },
]

/**
 * Find the day entry in the plan that matches today (by full day name).
 * Gracefully handles mismatches by falling back to array position.
 */
function getTodayEntry(weeklyPlan, planIndex) {
  const expectedName = PLAN_DAY_NAMES[planIndex]
  // Try name-match first (most reliable)
  const byName = weeklyPlan.find(
    (d) => (d.day || '').toLowerCase() === expectedName.toLowerCase(),
  )
  if (byName) return byName
  // Fall back to positional
  return weeklyPlan[planIndex] || null
}

/**
 * Get the entry for tomorrow, wrapping Sunday → Monday.
 */
function getTomorrowEntry(weeklyPlan, todayPlanIndex) {
  const tomorrowIndex = (todayPlanIndex + 1) % 7
  const tomorrowName = PLAN_DAY_NAMES[tomorrowIndex]
  const byName = weeklyPlan.find(
    (d) => (d.day || '').toLowerCase() === tomorrowName.toLowerCase(),
  )
  return byName || weeklyPlan[tomorrowIndex] || null
}

/**
 * getNextMeal
 *
 * @param {Array} weeklyPlan  — 7-element array from the Spoonacular endpoint,
 *                              each element: { day, breakfast, lunch, dinner, nutrition }
 * @returns {Object}
 *   {
 *     meal        : string  — exact meal name from the plan
 *     mealType    : string  — "Breakfast" | "Lunch" | "Dinner"
 *     dayLabel    : string  — "Today" | "Tomorrow" | full day name
 *     dayOfWeek   : string  — full day name e.g. "Sunday"
 *     time        : string  — display time e.g. "8:00 AM"
 *     calories    : number  — day's calories from nutrition object (0 if unknown)
 *     nutrition   : object  — { calories, protein, fat, carbohydrates }
 *     isTomorrow  : boolean
 *   }
 */
export function getNextMeal(weeklyPlan) {
  const empty = {
    meal: 'No meal scheduled',
    mealType: '',
    dayLabel: '',
    dayOfWeek: '',
    time: '',
    calories: 0,
    nutrition: {},
    isTomorrow: false,
  }

  if (!Array.isArray(weeklyPlan) || weeklyPlan.length === 0) return empty

  const now = new Date()
  const currentHour = now.getHours()        // 0-23 local time
  const currentMinutes = now.getMinutes()
  const fractionalHour = currentHour + currentMinutes / 60

  const todayPlanIndex = jsDayToPlanIndex(now.getDay())
  const todayEntry = getTodayEntry(weeklyPlan, todayPlanIndex)

  if (!todayEntry) return empty

  // Find the active meal slot for the current time
  // A slot is active when: startHour <= fractionalHour < cutoffHour
  for (const slot of MEAL_SCHEDULE) {
    if (fractionalHour >= slot.startHour && fractionalHour < slot.cutoffHour) {
      const mealName = todayEntry[slot.field] || 'Meal not set'
      return {
        meal: mealName,
        mealType: capitalize(slot.type),
        dayLabel: 'Today',
        dayOfWeek: todayEntry.day || PLAN_DAY_NAMES[todayPlanIndex],
        time: slot.displayTime,
        calories: todayEntry.nutrition?.calories || 0,
        nutrition: todayEntry.nutrition || {},
        isTomorrow: false,
      }
    }
  }

  // All of today's meals have passed — next is tomorrow's breakfast
  const tomorrowEntry = getTomorrowEntry(weeklyPlan, todayPlanIndex)
  if (!tomorrowEntry) return empty

  const tomorrowName = tomorrowEntry.day || PLAN_DAY_NAMES[(todayPlanIndex + 1) % 7]

  return {
    meal: tomorrowEntry.breakfast || 'Meal not set',
    mealType: 'Breakfast',
    dayLabel: 'Tomorrow',
    dayOfWeek: tomorrowName,
    time: '8:00 AM',
    calories: tomorrowEntry.nutrition?.calories || 0,
    nutrition: tomorrowEntry.nutrition || {},
    isTomorrow: true,
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * getCurrentDayName — returns the full local day name e.g. "Saturday"
 */
export function getCurrentDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}
