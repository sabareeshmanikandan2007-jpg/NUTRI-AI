import { motion } from 'framer-motion'
import { FiClock, FiDroplet, FiTarget, FiSunrise } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { subscribe, getCachedPlan } from '../scripts/services/mealService'
import { getNextMeal } from '../scripts/utils/mealScheduler'
import ProfileLockPanel from './ProfileLockPanel'

export default function DashboardCards({ tracker: _tracker, profileComplete = true, onCompleteProfile }) {
  const [nextMealData, setNextMealData] = useState(null)
  const [planError, setPlanError] = useState(null)

  useEffect(() => {
    if (!profileComplete) return undefined

    // Subscribe to the singleton meal plan cache.
    // The callback fires immediately with any cached value, then again
    // whenever the plan is refreshed (e.g. after a profile save).
    const unsubscribe = subscribe((plan, error) => {
      if (error) {
        setPlanError(error)
        return
      }
      if (plan?.meal_plan?.length) {
        setPlanError(null)
        setNextMealData(getNextMeal(plan.meal_plan))
      }
    })

    // Re-compute "next meal" every minute so the card stays current
    // without re-fetching — the plan object in memory is reused.
    const tick = setInterval(() => {
      const cached = getCachedPlan()
      if (cached?.meal_plan?.length) {
        setNextMealData(getNextMeal(cached.meal_plan))
      }
    }, 60_000)

    return () => {
      unsubscribe()
      clearInterval(tick)
    }
  }, [profileComplete])

  if (!profileComplete) {
    return (
      <section id="dashboard" className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <ProfileLockPanel
            title="Your dashboard is waiting for profile setup"
            message="Complete your nutrition profile to unlock personalized dashboard insights, meal timing, and calorie guidance."
            onCompleteProfile={onCompleteProfile}
          />
        </div>
      </section>
    )
  }

  return (
    <section id="dashboard" className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Next Meal card ── */}
      <motion.article
        whileHover={{ y: -4, scale: 1.01 }}
        className="h-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:shadow-xl"
      >
        <h3 className="text-sm font-semibold text-slate-500">Next Meal</h3>

        {planError ? (
          <p className="mt-4 text-xs text-red-500">{planError}</p>
        ) : !nextMealData ? (
          <div className="mt-6 space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Day / tomorrow badge */}
            {nextMealData.isTomorrow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                <FiSunrise className="text-xs" />
                Tomorrow · {nextMealData.dayOfWeek}
              </span>
            )}
            {!nextMealData.isTomorrow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                {nextMealData.mealType} · {nextMealData.dayOfWeek}
              </span>
            )}

            {/* Meal name */}
            <div className="flex items-start gap-2 text-slate-800">
              <FiTarget className="mt-0.5 shrink-0 text-emerald-500" />
              <span className="font-semibold leading-snug">{nextMealData.meal}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-slate-500">
              <FiClock className="shrink-0 text-emerald-400" />
              <span className="text-sm">{nextMealData.time}</span>
            </div>

            {/* Calories (if available) */}
            {nextMealData.calories > 0 && (
              <p className="text-xs font-medium text-slate-400">
                ~{nextMealData.calories} kcal this day
              </p>
            )}
          </div>
        )}
      </motion.article>

      {/* ── Water Intake card ── */}
      <motion.article
        whileHover={{ y: -4, scale: 1.01 }}
        className="h-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:shadow-xl"
      >
        <h3 className="text-sm font-semibold text-slate-500">Water Intake</h3>
        <div className="mt-5 flex items-center gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className={`flex h-10 w-7 items-end justify-center rounded-md border border-emerald-200 ${
                index < 6 ? 'bg-emerald-100' : 'bg-white'
              }`}
            >
              <FiDroplet
                className={`mb-1 text-sm ${index < 6 ? 'text-emerald-500' : 'text-slate-300'}`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-slate-600">6 / 8 glasses</p>
      </motion.article>
    </section>
  )
}
