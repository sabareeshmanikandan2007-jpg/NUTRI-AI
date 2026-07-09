import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiActivity, FiImage, FiTrendingUp } from 'react-icons/fi'

export default function FeatureSection() {
  const [preview, setPreview] = useState('')

  const chartPoints = useMemo(
    () =>
      [
        [0, 70],
        [25, 52],
        [50, 58],
        [75, 38],
        [100, 44],
      ]
        .map(([x, y]) => `${x},${y}`)
        .join(' '),
    [],
  )

  const onFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPreview('')
      return
    }

    setPreview(URL.createObjectURL(file))
  }

  return (
    <section id="health-insights" className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <motion.article id="image-recognition" whileHover={{ y: -4 }} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FiImage className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Food Image Recognition</h3>
        </div>
        <label className="mt-4 flex h-40 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-sm text-slate-600">
          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {preview ? (
            <img src={preview} alt="Food preview" className="h-full w-full rounded-xl object-cover" />
          ) : (
            'Upload food image'
          )}
        </label>
      </motion.article>

      <motion.article whileHover={{ y: -4 }} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FiActivity className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Health Condition Prediction</h3>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-700">
            Prediabetes risk: <span className="font-semibold text-emerald-700">Low (18%)</span>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-700">
            Cholesterol trend: <span className="font-semibold text-emerald-700">Stable</span>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-700">
            Recommendation: Increase leafy greens by 15% this week.
          </div>
        </div>
      </motion.article>

      <motion.article id="calorie-tracker" whileHover={{ y: -4 }} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Calorie Tracker Visualization</h3>
        </div>
        <svg viewBox="0 0 100 80" className="mt-5 h-40 w-full rounded-xl bg-emerald-50 p-3">
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            points={chartPoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-xs text-slate-500">7-day burn vs intake trend</p>
      </motion.article>
    </section>
  )
}
