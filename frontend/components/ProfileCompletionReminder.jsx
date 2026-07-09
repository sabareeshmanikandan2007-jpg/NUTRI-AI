import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowRight, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'

export default function ProfileCompletionReminder({
  open,
  completionPercent,
  missingRequiredFields,
  optionalMissingFields,
  onCompleteProfile,
  onLater,
}) {
  const dialogRef = useRef(null)
  const firstActionRef = useRef(null)

  const checklist = useMemo(() => {
    const required = missingRequiredFields.map(({ label }) => ({ label, complete: false, optional: false }))
    const optional = optionalMissingFields.map(({ label }) => ({ label, complete: false, optional: true }))
    return [...required, ...optional]
  }, [missingRequiredFields, optionalMissingFields])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onLater()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll(focusableSelector)
      if (!focusableElements || focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => {
      firstActionRef.current?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onLater])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-xl"
            aria-hidden="true"
            onClick={onLater}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-reminder-title"
            aria-describedby="profile-reminder-description"
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[20px] border border-white/50 bg-white/85 shadow-[0_25px_80px_rgba(16,185,129,0.25)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50" />
            <div className="absolute -right-20 -top-16 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-200/35 blur-3xl" />

            <div className="relative p-5 sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-lime-500 text-2xl shadow-lg shadow-emerald-500/20">
                    🥗
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      <FiClock />
                      Profile reminder
                    </p>
                    <h2 id="profile-reminder-title" className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Complete Your Nutrition Profile
                    </h2>
                    <p id="profile-reminder-description" className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                      To provide accurate AI-powered meal plans, calorie tracking, nutrition analysis, and personalized recommendations, please complete your profile.
                      It only takes about a minute.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLater}
                  className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close reminder"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Profile completion</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">{completionPercent}% Complete</p>
                    </div>
                    <div className="relative h-16 w-16 shrink-0">
                      <div className="absolute inset-0 rounded-full bg-slate-100" />
                      <div
                        className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#10B981_0%,#06B6D4_55%,#84CC16_100%)]"
                        style={{ clipPath: `inset(0 ${100 - completionPercent}% 0 0)` }}
                      />
                      <div className="absolute inset-[6px] rounded-full bg-white/95" />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-700">
                        {completionPercent}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-lime-500 transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {checklist.map((field) => (
                      <li
                        key={`${field.label}-${field.optional ? 'optional' : 'required'}`}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-700">
                          {field.optional ? `${field.label} (optional)` : field.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5">
                            ✗
                          </span>
                          Missing
                        </span>
                      </li>
                    ))}
                    {checklist.length === 0 ? (
                      <li className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
                        <span className="font-medium">All required fields are complete</span>
                        <FiCheckCircle />
                      </li>
                    ) : null}
                  </ul>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Why this matters</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                      <li className="flex gap-3">
                        <span className="mt-0.5 text-emerald-600">
                          <FiCheckCircle />
                        </span>
                        More accurate meal plans and calorie targets
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 text-emerald-600">
                          <FiCheckCircle />
                        </span>
                        Better AI food analysis and nutrition advice
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 text-emerald-600">
                          <FiCheckCircle />
                        </span>
                        Personalized reminders and hydration goals
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      ref={firstActionRef}
                      onClick={onCompleteProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2"
                    >
                      Complete Profile
                      <FiArrowRight />
                    </button>

                    <button
                      type="button"
                      onClick={onLater}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
