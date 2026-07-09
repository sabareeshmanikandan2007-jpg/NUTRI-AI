import { Link } from 'react-router-dom'
import { FiLogOut, FiUser } from 'react-icons/fi'

export default function Navbar({ onSignOut }) {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/home" className="text-2xl font-extrabold tracking-tight text-emerald-600">
          NutriAI
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50"
          >
            <FiUser />
          </Link>
          <button
            onClick={onSignOut}
            className="hidden items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 md:flex"
          >
            <FiLogOut />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

