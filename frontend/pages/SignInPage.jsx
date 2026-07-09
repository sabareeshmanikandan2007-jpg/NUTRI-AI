import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SignInPage({ onAuthSuccess }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let errorMessage = 'Login failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData?.detail || errorData?.message || 'Login failed'
        } catch {
          // Clone the response to read the body again
          try {
            const errorText = await response.clone().text()
            errorMessage = errorText || errorMessage
          } catch {
            errorMessage = 'Login failed'
          }
        }
        throw new Error(errorMessage)
      }

      let data;
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError)
        // Clone and read as text if JSON fails
        try {
          const text = await response.clone().text()
          throw new Error(`Invalid response: ${text}`)
        } catch {
          throw new Error('Invalid response from server. Please try again.')
        }
      }
      
      const token = data?.data?.access_token

      if (!token) {
        throw new Error('No token received. Login may have failed.')
      }

      localStorage.setItem('nutriai-auth-token', token)
      localStorage.setItem('nutriai-auth', 'true')
      await onAuthSuccess()
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-emerald-100 px-4 py-8">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
        <p className="mt-1 text-sm text-slate-500">Welcome back to NutriAI.</p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create one
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
