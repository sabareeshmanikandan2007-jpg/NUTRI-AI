import { FiLock, FiArrowRight } from 'react-icons/fi'

export default function ProfileLockPanel({ title, message, onCompleteProfile }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-cyan-50/60" />
      <div className="relative flex h-full min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
          <FiLock className="text-2xl" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Locked feature</p>
        <h3 className="mt-2 text-xl font-extrabold text-slate-900">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p>
        <button
          type="button"
          onClick={onCompleteProfile}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2"
        >
          Complete Profile
          <FiArrowRight />
        </button>
      </div>
    </div>
  )
}
