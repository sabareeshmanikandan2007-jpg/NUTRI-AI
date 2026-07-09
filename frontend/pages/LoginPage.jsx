import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    smtpEmail: '',
    smtpPassword: '',
    useSmtp: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({ 
      ...previous, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // Generate a name from email that meets minimum length requirement (2 chars)
      const emailPrefix = form.email.split('@')[0];
      const generatedName = emailPrefix.length >= 2 ? emailPrefix : `User_${Date.now()}`;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: generatedName,
          smtp_email: form.useSmtp ? (form.smtpEmail || form.email) : null,
          smtp_password: form.useSmtp ? form.smtpPassword : null,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Registration failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData?.detail || errorData?.message || 'Registration failed'
        } catch {
          // Clone the response to read the body again
          try {
            const errorText = await response.clone().text()
            errorMessage = errorText || errorMessage
          } catch {
            errorMessage = 'Registration failed'
          }
        }
        throw new Error(errorMessage)
      }

      let data;
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse registration response:', parseError)
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
        throw new Error('No token received. Registration may have failed.')
      }

      localStorage.setItem('nutriai-auth-token', token)
      localStorage.setItem('nutriai-auth', 'true')
      await onAuthSuccess()
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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
        <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
        <p className="mt-1 text-sm text-slate-500">Start your personalized nutrition journey.</p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={form.password}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          {/* New SMTP Reminders Section */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 text-left">
            <label className="flex cursor-pointer items-center justify-between gap-3">
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Email Reminders</span>
                  <span className="text-[10px] text-slate-500 italic">Get meal alerts in your inbox</span>
               </div>
               <input 
                 type="checkbox" 
                 name="useSmtp" 
                 checked={form.useSmtp} 
                 onChange={onChange}
                 className="h-5 w-5 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-200"
               />
            </label>
            
            {form.useSmtp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2 overflow-hidden border-t border-emerald-100 pt-3"
              >
                 <div className="grid gap-2">
                    <label className="text-[11px] font-semibold text-slate-500">SMTP Email (defaults to login email)</label>
                    <input
                      type="email"
                      name="smtpEmail"
                      placeholder={form.email || "SENDER@gmail.com"}
                      value={form.smtpEmail}
                      onChange={onChange}
                      className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-700 outline-none ring-emerald-50 focus:ring-2"
                    />
                 </div>
                 <div className="grid gap-2">
                    <label className="text-[11px] font-semibold text-slate-500">SMTP App Password</label>
                    <input
                      type="password"
                      name="smtpPassword"
                      placeholder="Gmail 16-char App Password"
                      value={form.smtpPassword}
                      onChange={onChange}
                      required={form.useSmtp}
                      className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-700 outline-none ring-emerald-50 focus:ring-2"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400">
                    Reminders are sent via your email to your email.
                 </p>
              </motion.div>
            )}
          </div>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-emerald-600 hover:text-emerald-700" to="/signin">
            Sign In
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
