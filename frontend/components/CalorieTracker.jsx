import { useState, useEffect } from 'react'
import BgDecor from './BgDecor'
import { FiPlus, FiTrash2, FiSearch } from 'react-icons/fi'
import { apiFetch } from '../scripts/api'

export default function CalorieTracker() {
  const [search, setSearch] = useState('')
  const [log, setLog] = useState([])
  const GOAL = 2100

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const token = localStorage.getItem('nutriai-auth-token')
        if (!token) return
        const response = await apiFetch('/api/food/daily-calories', {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        const meals = data?.data?.meals || []
        setLog(meals.map((m, i) => ({ ...m, id: m._id || Date.now() + i })))
      } catch (error) {
        console.error('Failed to load meals:', error)
      }
    }

    loadMeals()
    const interval = setInterval(loadMeals, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const addFood = async (food) => {
    const token = localStorage.getItem('nutriai-auth-token')
    if (!token) {
      // Fallback to localStorage
      setLog((prev) => [{ ...food, id: Date.now() }, ...prev])
      return
    }

    try {
      const response = await apiFetch('/api/food/add-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          food_name: food.name || food.food_name,
          calories: Number(food.cal || food.calories),
          protein: Number(food.protein),
          carbs: Number(food.carbs),
          fat: Number(food.fat),
          consumed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setLog((prev) => [food, ...prev])
      }
    } catch (error) {
      console.error('Failed to add meal:', error)
      setLog((prev) => [food, ...prev])
    }
  }

  const removeFood = (id) => {
    setLog((prev) => prev.filter((f) => f.id !== id))
  }

  const foodDatabase = [
  { name: 'Chicken Breast', cal: 165, protein: 31, carbs: 0, fat: 3.6, emoji: '🍗' },
  { name: 'Brown Rice (1 cup)', cal: 215, protein: 5, carbs: 45, fat: 1.8, emoji: '🍚' },
  { name: 'Broccoli (1 cup)', cal: 55, protein: 3.7, carbs: 11, fat: 0.6, emoji: '🥦' },
  { name: 'Banana', cal: 89, protein: 1.1, carbs: 23, fat: 0.3, emoji: '🍌' },
  { name: 'Greek Yogurt', cal: 100, protein: 10, carbs: 9, fat: 2.5, emoji: '🥛' },
  { name: 'Almonds (30g)', cal: 170, protein: 6, carbs: 6, fat: 15, emoji: '🌰' },
  { name: 'Salmon (100g)', cal: 208, protein: 20, carbs: 0, fat: 13, emoji: '🐟' },
  { name: 'Whole Grain Bread', cal: 80, protein: 4, carbs: 15, fat: 1.2, emoji: '🍞' },
  { name: 'Avocado (half)', cal: 120, protein: 1.5, carbs: 6, fat: 11, emoji: '🥑' },
  { name: 'Apple', cal: 95, protein: 0.5, carbs: 25, fat: 0.3, emoji: '🍎' },
];

  const filtered = foodDatabase.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totals = log.reduce(
    (acc, item) => ({
      cal: acc.cal + Number(item.cal || item.calories || 0),
      protein: acc.protein + Number(item.protein || 0),
      carbs: acc.carbs + Number(item.carbs || 0),
      fat: acc.fat + Number(item.fat || 0),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return (
    <section id="calorie-tracker" className="relative py-24 bg-white overflow-hidden">
      <BgDecor theme="mixed" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-4">
            🔥 Real-time Tracking
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 font-[Outfit]">
            Calorie <span className="gradient-text">Tracker</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Search and log foods to track your daily nutrition intake in real time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Food Search */}
          <div>
            <div className="relative mb-4">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search food..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((food) => (
                <div
                  key={food.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={() => addFood(food)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{food.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{food.name}</p>
                      <p className="text-xs text-gray-400">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-500">{food.cal} kcal</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-500 flex items-center justify-center text-emerald-600 hover:text-white transition-all">
                      <FiPlus size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log & Summary */}
          <div>
            {/* Goal ring */}
            <div className="card p-5 border border-gray-100 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3"
                      strokeDasharray={`${Math.min((totals.cal / GOAL) * 100, 100)} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold text-gray-900">{Math.round((totals.cal / GOAL) * 100)}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Daily Calories</p>
                  <p className="text-2xl font-extrabold gradient-text">{totals.cal}</p>
                  <p className="text-xs text-gray-400">of {GOAL} kcal goal · {GOAL - totals.cal} remaining</p>
                  <div className="flex gap-3 mt-2">
                    {[
                      { label: 'P', value: totals.protein, color: 'text-blue-600' },
                      { label: 'C', value: totals.carbs, color: 'text-amber-600' },
                      { label: 'F', value: totals.fat, color: 'text-red-500' },
                    ].map(({ label, value, color }) => (
                      <span key={label} className={`text-xs font-bold ${color}`}>{label}: {Math.round(value)}g</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Food log */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {log.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">🍽️</div>
                  <p className="text-sm">No foods logged yet. Search and click to add!</p>
                </div>
              ) : (
                log.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.cal} kcal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFood(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
