import { motion } from 'framer-motion'

export default function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 md:p-10">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-emerald-300/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Smart AI Diet & Nutrition Planner
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
          Personalized meal plans, calorie tracking, and intelligent nutrition insights powered by AI.
        </p>

      </motion.div>
    </section>
  )
}

