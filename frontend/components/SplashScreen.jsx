import { motion } from 'framer-motion'

export default function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-400 via-emerald-100 to-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="rounded-3xl border border-emerald-200 bg-white/85 px-10 py-8 shadow-2xl backdrop-blur"
      >
        <img
          src="/images/NutriAI logo with green apple icon.png"
          alt="NutriAI app icon"
          className="mx-auto mb-4 h-44 w-44 rounded-full object-contain md:h-56 md:w-56"
        />
        <h1 className="text-center bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl">
          NutriAI
        </h1>
        <p className="mt-2 text-center text-sm font-medium text-slate-600">
          AI Diet & Nutrition Planner
        </p>
      </motion.div>
    </div>
  )
}
