import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi'

export default function ProfileCompletionBanner({ completionPercent, onCompleteProfile }) {
  return (
    <section className="rounded-[20px] border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/70 to-cyan-50/70 p-4 shadow-[0_14px_40px_rgba(16,185,129,0.12)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <FiAlertTriangle />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Profile incomplete</p>
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              Complete your nutrition profile to unlock personalized AI recommendations.
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Profile completion is {completionPercent}% complete. Finish your setup to enable meal plans, AI chat, and calorie insights.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCompleteProfile}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2"
        >
          Complete Now
          <FiArrowRight />
        </button>
      </div>
    </section>
  )
}
