import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaUtensils, FaDumbbell, FaBolt, FaCalendarAlt } from 'react-icons/fa'

export default function AIRecommendations() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAIPlan = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('nutriai-auth-token')
      const response = await fetch('/api/diet/ai-weekly-plan', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setPlan(result.data)
      } else {
        setError(result.detail || result.error || 'Failed to fetch AI plan')
      }
    } catch {
      setError('Connection error: backend might be offline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAIPlan()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="mb-4 font-medium text-red-600">Error: {error}</p>
        <button
          onClick={fetchAIPlan}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          Retry Fetching Plan
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Tip: Ensure your <code className="bg-slate-100 px-1">OPENROUTER_API_KEY</code> in <code className="bg-slate-100 px-1">backend/.env</code> is valid.
        </p>
      </div>
    )
  }
  if (!plan) return null

  return (
    <div className="space-y-8">
      {/* 7-Day Meal Plan */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <FaUtensils />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">7-Day Nutrition Plan</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plan.meal_plan.map((day, idx) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-emerald-700">{day.day}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {day.nutrition.calories} kcal
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Breakfast</span>
                  <p className="text-slate-700">{day.breakfast}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Lunch</span>
                  <p className="text-slate-700">{day.lunch}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Dinner</span>
                  <p className="text-slate-700">{day.dinner}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Daily Exercise Routine */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <FaDumbbell />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Exercise Feature</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plan.exercises.map((ex, idx) => (
            <motion.div
              key={ex.day}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-blue-700">{ex.day}</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                  <FaBolt className="text-[8px]" /> {ex.estimated_burn} BURN
                </div>
              </div>
              <p className="text-sm text-slate-700">{ex.routine}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
