import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ProfileLockPanel from './ProfileLockPanel'
import { apiFetch } from '../scripts/api'

// Different meal plans based on goals
const mealPlansByGoal = {
  'Weight Loss': {
    breakfast: ['Greek yogurt + granola', 'Egg whites toast', 'Oatmeal + berries', 'Smoothie bowl', 'Chia pudding'],
    lunch: ['Grilled chicken + broccoli', 'Turkey salad', 'Lentil soup', 'Tuna bowl', 'Quinoa salad'],
    dinner: ['Baked salmon + vegetables', 'Lean beef + rice', 'Tofu stir-fry', 'Grilled fish', 'Chicken breast + sweet potato'],
  },
  'Weight Gain': {
    breakfast: ['Oats + peanut butter', 'Bagel + eggs', 'Protein pancakes', 'Acai bowl', 'Avocado toast'],
    lunch: ['Burger + fries', 'Pasta + meat sauce', 'Rice + chicken + oil', 'Sandwich + chips', 'Burrito bowl'],
    dinner: ['Pizza', 'Steak + potato', 'Pasta + cream sauce', 'Fish + chips', 'Chicken thighs + rice'],
  },
  'Maintain': {
    breakfast: ['Oats + berries', 'Greek yogurt', 'Egg toast', 'Smoothie bowl', 'Chia pudding'],
    lunch: ['Quinoa salad', 'Turkey bowl', 'Lentil soup', 'Chicken wrap', 'Rice + beans'],
    dinner: ['Grilled salmon', 'Chicken stir-fry', 'Tofu curry', 'Baked fish', 'Veggie pasta'],
  },
}

function generatePersonalizedMealPlan(goal = 'Maintain') {
  const meals = mealPlansByGoal[goal] || mealPlansByGoal['Maintain']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return days.map((day, index) => ({
    day,
    breakfast: meals.breakfast[index % meals.breakfast.length],
    lunch: meals.lunch[index % meals.lunch.length],
    dinner: meals.dinner[index % meals.dinner.length],
  }))
}

function calculateCalorieTarget(profile) {
  if (!profile) return 2100
  const base = 22 * Number(profile.weight)
  const multiplierByLevel = {
    Sedentary: 1.2,
    'Lightly Active': 1.35,
    'Moderately Active': 1.5,
    'Very Active': 1.7,
  }
  let target = base * (multiplierByLevel[profile.activityLevel] || 1.4)
  return Math.max(1400, Math.round(target))
}

export default function MealPlanner({ profileComplete = true, onCompleteProfile }) {
  const [weeklyPlan, setWeeklyPlan] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [profile, setProfile] = useState(null)
  const [calorieTarget, setCalorieTarget] = useState(2100)

  useEffect(() => {
    if (!profileComplete) {
      return undefined
    }

    let cancelled = false

    const loadMealPlan = async () => {
      try {
        const savedProfile = localStorage.getItem('nutriai-profile')
        const currentProfile = savedProfile ? JSON.parse(savedProfile) : null
        setProfile(currentProfile)

        const calories = calculateCalorieTarget(currentProfile)
        setCalorieTarget(calories)

        let goal = 'maintain'
        
        console.log(`🎯 Loading meal plan for goal: ${goal}`)

        // Load from local meal planner
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

        try {
          const response = await fetch(
            `/api/meal-plan?calories=${calories}&goal=${goal}`,
            { signal: controller.signal }
          )

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.warn(
              `API returned ${response.status}, using personalized fallback for ${goal}`
            )
            throw new Error(`Server returned ${response.status}`)
          }

          let payload
          try {
            payload = await response.json()
          } catch (jsonErr) {
            console.error('Failed to parse response JSON:', jsonErr)
            throw new Error('Server responded with invalid data format')
          }

          if (!cancelled && Array.isArray(payload?.days) && payload.days.length > 0) {
            setWeeklyPlan(payload.days)
            setApiError('')
          } else {
            throw new Error('No meal plan data received from API')
          }
        } catch (apiError) {
          clearTimeout(timeoutId)

          // Use personalized fallback based on user's goal
          if (!cancelled) {
            console.log(
              `API error (${apiError.message}), using personalized fallback for goal: ${goal}`
            )
            const personalizedPlan = generatePersonalizedMealPlan(goal)
            setWeeklyPlan(personalizedPlan)
            setApiError(
              `API unavailable - showing personalized ${goal.toLowerCase()} meal plan based on your profile`
            )
          }
        }
      } catch (error) {
        if (!cancelled) {
          const defaultGoal = 'Maintain'
          const defaultPlan = generatePersonalizedMealPlan(defaultGoal)
          setWeeklyPlan(defaultPlan)
          setApiError('Using default meal plan')
          console.error('Meal plan loading error:', error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMealPlan()

    const handleProfileUpdate = () => {
      setLoading(true)
      loadMealPlan()
    }

    const handleStorageChange = () => {
      setLoading(true)
      loadMealPlan()
    }

    window.addEventListener('nutriai-profile-updated', handleProfileUpdate)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      cancelled = true
      window.removeEventListener('nutriai-profile-updated', handleProfileUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [profileComplete])

  if (!profileComplete) {
    return (
      <ProfileLockPanel
        title="Meal planner locked"
        message="We need your profile details before generating a 7-day meal plan tailored to your goals and preferences."
        onCompleteProfile={onCompleteProfile}
      />
    )
  }

  return (
    <motion.section id="meal-planner" whileInView={{ opacity: [0, 1], y: [24, 0] }} viewport={{ once: true }} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Weekly Meal Planner</h3>
          {profile ? (
            <p className="mt-1 text-xs text-slate-500">
              Personalized for {profile.name || 'you'} • {calorieTarget} kcal/day
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              <a href="/profile" className="font-semibold text-emerald-600 hover:text-emerald-700 underline">Update your profile</a> to get personalized meal plans based on your weight and height
            </p>
          )}
        </div>
        {loading ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Generating...</span> : null}
      </div>
      {apiError ? <p className="mt-2 text-xs text-amber-700">{apiError}</p> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-xl bg-emerald-500 px-3 py-2 text-white">Day</th>
              <th className="bg-emerald-500 px-3 py-2 text-white">Breakfast</th>
              <th className="bg-emerald-500 px-3 py-2 text-white">Lunch</th>
              <th className="rounded-tr-xl bg-emerald-500 px-3 py-2 text-white">Dinner</th>
            </tr>
          </thead>
          <tbody>
            {weeklyPlan.map((meal, index) => (
              <tr key={meal.day}>
                <td className={`border border-emerald-100 px-3 py-2 font-semibold text-slate-700 ${index === weeklyPlan.length - 1 ? 'rounded-bl-xl' : ''}`}>
                  {meal.day}
                </td>
                <td className="border border-emerald-100 px-3 py-2 text-slate-600">{meal.breakfast}</td>
                <td className="border border-emerald-100 px-3 py-2 text-slate-600">{meal.lunch}</td>
                <td className={`border border-emerald-100 px-3 py-2 text-slate-600 ${index === weeklyPlan.length - 1 ? 'rounded-br-xl' : ''}`}>
                  {meal.dinner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}

