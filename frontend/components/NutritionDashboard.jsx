import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { FaFire, FaBolt, FaUtensils, FaWeightHanging, FaChartBar } from 'react-icons/fa'
import { FiTrendingDown, FiTrendingUp, FiMinusCircle } from 'react-icons/fi'
import { subscribe } from '../scripts/services/mealService'

function StatCard({ icon, label, value, unit, color, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${color}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {value} <span className="text-base font-medium text-slate-400">{unit}</span>
          </p>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        <div className="rounded-xl p-3 bg-slate-50 text-xl">{icon}</div>
      </div>
    </motion.div>
  )
}

function GoalCard({ goal, icon, active }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border p-4 ${
        active ? 'border-emerald-300 bg-emerald-50 shadow-md' : 'border-slate-100 bg-white'
      }`}
    >
      <div className={`mb-2 text-2xl ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{icon}</div>
      <p className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-slate-600'}`}>{goal.label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-800">{goal.daily_calories}</p>
      <p className="text-[11px] text-slate-400">kcal / day</p>
      <p className="mt-2 text-center text-[10px] text-slate-500">{goal.description}</p>
      {active && (
        <span className="mt-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
          YOUR GOAL
        </span>
      )}
    </div>
  )
}

// ── Calorie Burn Chart ──────────────────────────────────────────────────────
function CalorieBurnChart({ burnData }) {
  const chartData = burnData.map((d) => ({
    date: d.date.slice(5), // show MM-DD
    'Calorie Burn':   Math.round(d.burn),
    'Calorie Intake': Math.round(d.intake),
  }))

  // Compute a sensible Y-axis max so both bars are always visible
  const allValues = chartData.flatMap(d => [d['Calorie Burn'], d['Calorie Intake']])
  const maxVal = Math.max(...allValues, 500)
  const yMax   = Math.ceil(maxVal / 500) * 500 + 300

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-700">Last 7 Days — Intake vs Burn</p>
      <p className="mb-4 text-xs text-slate-400">
        Burn = BMR × activity multiplier. Intake = meals logged or planned daily calories.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `${v}`}
            width={45}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value, name) => [`${value} kcal`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Calorie Burn"   fill="#fb923c" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Calorie Intake" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Meal Table ───────────────────────────────────────────────────────────────
function MealTable({ mealPlan, targetCalories }) {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Target: <strong>{targetCalories} kcal/day</strong> · Personalized via Spoonacular
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-emerald-100">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-xl bg-emerald-500 px-4 py-2 text-left text-white">Day</th>
              <th className="bg-emerald-500 px-4 py-2 text-left text-white">Breakfast</th>
              <th className="bg-emerald-500 px-4 py-2 text-left text-white">Lunch</th>
              <th className="bg-emerald-500 px-4 py-2 text-left text-white">Dinner</th>
              <th className="rounded-tr-xl bg-emerald-500 px-4 py-2 text-center text-white">Kcal</th>
            </tr>
          </thead>
          <tbody>
            {mealPlan.map((day, i) => (
              <tr
                key={day.day}
                onClick={() => setSelected(selected === i ? null : i)}
                className={`cursor-pointer transition-colors ${
                  selected === i ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <td className="border-b border-emerald-50 px-4 py-2 font-semibold text-emerald-700">
                  {day.day}
                </td>
                <td className="border-b border-emerald-50 px-4 py-2 text-slate-600">{day.breakfast}</td>
                <td className="border-b border-emerald-50 px-4 py-2 text-slate-600">{day.lunch}</td>
                <td className="border-b border-emerald-50 px-4 py-2 text-slate-600">{day.dinner}</td>
                <td className="border-b border-emerald-50 px-4 py-2 text-center font-semibold text-slate-700">
                  {day.nutrition?.calories ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected !== null && mealPlan[selected]?.nutrition && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3"
        >
          <p className="mb-2 text-xs font-bold uppercase text-emerald-700">
            {mealPlan[selected].day} · Nutrition Breakdown
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>🔥 <strong>{mealPlan[selected].nutrition.calories}</strong> kcal</span>
            <span>💪 Protein: <strong>{mealPlan[selected].nutrition.protein}g</strong></span>
            <span>🌾 Carbs: <strong>{mealPlan[selected].nutrition.carbohydrates}g</strong></span>
            <span>🥑 Fat: <strong>{mealPlan[selected].nutrition.fat}g</strong></span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function NutritionDashboard() {
  const [calorieStats, setCalorieStats] = useState(null)
  const [burnData, setBurnData] = useState(null)
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState({ calories: true, burn: true, meals: true })
  const [errors, setErrors] = useState({ calories: '', meals: '' })

  const token = localStorage.getItem('nutriai-auth-token')
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchCalorieStats = useCallback(async () => {
    try {
      const resp = await fetch('/api/diet/calorie-stats', { headers: authHeader })
      const data = await resp.json()
      if (data.success) {
        setCalorieStats(data.data)
      } else {
        setErrors((e) => ({ ...e, calories: data.detail || 'Failed to load calorie stats' }))
      }
    } catch {
      setErrors((e) => ({ ...e, calories: 'Connection error loading calorie stats' }))
    } finally {
      setLoading((l) => ({ ...l, calories: false }))
    }
  }, [authHeader])

  const fetchBurnData = useCallback(async () => {
    try {
      const resp = await fetch('/api/progress', { headers: authHeader })
      const data = await resp.json()
      if (data.success && data.data?.calorie_burn?.length) {
        setBurnData(data.data.calorie_burn)
      } else {
        setBurnData([])
      }
    } catch {
      setBurnData([])
    } finally {
      setLoading((l) => ({ ...l, burn: false }))
    }
  }, [authHeader])

  // ── Meal plan: read from the singleton cache, not from an independent fetch ──
  useEffect(() => {
    const unsubscribe = subscribe((plan, error) => {
      if (error) {
        setErrors((e) => ({ ...e, meals: error }))
        setLoading((l) => ({ ...l, meals: false }))
        return
      }
      if (plan) {
        setMealPlan(plan)
        setErrors((e) => ({ ...e, meals: '' }))
      }
      setLoading((l) => ({ ...l, meals: false }))
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    fetchCalorieStats()
    fetchBurnData()
  }, [fetchCalorieStats, fetchBurnData])

  // Determine which GoalCard is active based on the user's actual goal
  function isActiveGoal(key) {
    if (!calorieStats) return key === 'balanced'
    const goal = (calorieStats.user_goal || '').toLowerCase()
    if (key === 'weight_loss') return goal.includes('loss')
    if (key === 'weight_gain') return goal.includes('gain')
    return !goal.includes('loss') && !goal.includes('gain') // balanced / default
  }

  const Loader = () => (
    <div className="space-y-3">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  )

  const ErrorBox = ({ msg, onRetry }) => (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 flex items-center justify-between gap-3">
      <span>{msg}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600"
        >
          Retry
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-8">

      {/* ── SECTION 1: Calorie Burn Overview ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-rose-100 p-2 text-rose-600"><FaFire /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Daily Calorie Burn</h2>
            <p className="text-xs text-slate-500">Estimated from your profile using Mifflin-St Jeor formula</p>
          </div>
        </div>

        {loading.calories ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : errors.calories ? (
          <ErrorBox msg={errors.calories} onRetry={fetchCalorieStats} />
        ) : calorieStats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<FaChartBar className="text-rose-500" />}
                label="Basal Metabolic Rate"
                value={calorieStats.bmr}
                unit="kcal"
                color="border-rose-100"
                description="Calories burned at complete rest"
              />
              <StatCard
                icon={<FaBolt className="text-amber-500" />}
                label="Daily Active Calories"
                value={calorieStats.activity_calories}
                unit="kcal"
                color="border-amber-100"
                description="Extra burn from your activity level"
              />
              <StatCard
                icon={<FaFire className="text-orange-500" />}
                label="Total Burn (TDEE)"
                value={calorieStats.tdee}
                unit="kcal"
                color="border-orange-100"
                description="Total daily energy expenditure"
              />
              <StatCard
                icon={<FaWeightHanging className="text-purple-500" />}
                label="BMI"
                value={calorieStats.bmi}
                unit=""
                color="border-purple-100"
                description={`Category: ${calorieStats.bmi_category}`}
              />
            </div>

            {/* Goal Calorie Cards */}
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-600">Calorie Targets by Goal</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <GoalCard
                  goal={calorieStats.goals.weight_loss}
                  icon={<FiTrendingDown />}
                  active={isActiveGoal('weight_loss')}
                />
                <GoalCard
                  goal={calorieStats.goals.balanced}
                  icon={<FiMinusCircle />}
                  active={isActiveGoal('balanced')}
                />
                <GoalCard
                  goal={calorieStats.goals.weight_gain}
                  icon={<FiTrendingUp />}
                  active={isActiveGoal('weight_gain')}
                />
              </div>
            </div>

            {/* Calorie Burn Chart */}
            {!loading.burn && burnData && burnData.length > 0 && (
              <div className="mt-5">
                <CalorieBurnChart burnData={burnData} />
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* ── SECTION 2: 7-Day Meal Plan ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600"><FaUtensils /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">7-Day Nutrition Meal Plan</h2>
            <p className="text-xs text-slate-500">Personalized via Spoonacular · Click a row to see nutrition details</p>
          </div>
        </div>

        {loading.meals ? (
          <Loader />
        ) : errors.meals ? (
          <ErrorBox msg={errors.meals} onRetry={() => { import('../scripts/services/mealService').then(m => m.invalidate()) }} />
        ) : mealPlan ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <MealTable mealPlan={mealPlan.meal_plan} targetCalories={mealPlan.target_calories} />
          </div>
        ) : null}
      </section>

    </div>
  )
}
