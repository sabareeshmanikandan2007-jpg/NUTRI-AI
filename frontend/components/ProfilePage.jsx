import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaBell, FaInfoCircle } from 'react-icons/fa'
import MealPlanManager from './MealPlanManager'
import { invalidate as invalidateMealCache } from '../scripts/services/mealService'
import {
  formatActivityLevel,
  getProfileCompletionState,
  mapApiProfileToLocal,
  mapFormToLocalProfile,
  syncProfileCompletionFlag,
} from '../scripts/profileCompletion'

const goals = ['Weight Loss', 'Weight Gain', 'Balanced']
const levels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active']

export default function ProfilePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: 'Moderately Active',
    goal: 'Balanced',
  })
  const [aiRecommendation, setAiRecommendation] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [saved, setSaved] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)

  // Load profile from backend on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('nutriai-auth-token')
        
        if (!token) {
          console.warn('No auth token found')
          setLoading(false)
          return
        }

        // First, initialize profile if needed
        try {
          await fetch('/api/profile/init', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        } catch (initError) {
          console.warn('Profile init error:', initError)
        }

        // Now fetch the profile
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`❌ Failed to load profile: ${response.status}`)
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log('✅ Profile loaded:', data)

        if (data.data) {
          const profileData = data.data
          setForm({
            name: profileData.name || '',
            age: profileData.age || '',
            gender: profileData.gender || '',
            height: profileData.height || '',
            weight: profileData.weight || '',
            activityLevel: profileData.activity_level ? formatActivityLevel(profileData.activity_level) : 'Moderately Active',
            goal: profileData.goal ? (profileData.goal.charAt(0).toUpperCase() + profileData.goal.slice(1).replace('_', ' ')) : 'Balanced',
          })

          syncProfileCompletionFlag({
            ...mapApiProfileToLocal(profileData),
            profileCompleted: profileData.profile_completed,
          })
          window.dispatchEvent(new Event('nutriai-profile-updated'))
          
          // Fetch reminder status explicitly
          try {
            const reminderResponse = await fetch('/api/reminder-status', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (reminderResponse.ok) {
              const reminderData = await reminderResponse.json()
              setReminderEnabled(reminderData.data?.reminder_enabled ?? true)
            }
          } catch (_e) {
            console.warn('Reminder status fetch failed:', _e)
          }

          console.log('✅ Form populated with profile data')
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const bmi = useMemo(() => {
    const heightMeters = Number(form.height) / 100
    if (!heightMeters || !form.weight) return 0
    return Number(form.weight) / (heightMeters * heightMeters)
  }, [form.height, form.weight])

  const analyzeGoal = async () => {
    try {
      setAnalyzing(true)
      const token = localStorage.getItem('nutriai-auth-token')
      const response = await fetch('/api/diet/analyze-weight-card', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.success) {
        setAiRecommendation(result.data)
        const recommended = result.data.recommended_goal
        const formatted = recommended.charAt(0).toUpperCase() + recommended.slice(1)
        setForm(prev => ({ ...prev, goal: formatted }))
      }
    } catch (error) {
      console.error('Goal analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const calorieTarget = useMemo(() => {
    if (!form.weight) return 0
    const base = 22 * Number(form.weight)
    const multiplierByLevel = {
      Sedentary: 1.2,
      'Lightly Active': 1.35,
      'Moderately Active': 1.5,
      'Very Active': 1.7,
    }

    let target = base * (multiplierByLevel[form.activityLevel] || 1.4)
    return Math.max(1400, Math.round(target))
  }, [form.weight, form.activityLevel])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setSaved(false)
  }

  const onSave = async (event) => {
    event.preventDefault()

    const completionCheck = getProfileCompletionState(mapFormToLocalProfile(form))
    if (!completionCheck.profileCompleted) {
      setSaveError('Please fill in all required fields: Full Name, Age, Gender, Height, Weight, and Activity Level.')
      setSaved('error')
      return
    }

    setSaveError('')
    setSaved('saving')

    try {
      const token = localStorage.getItem('nutriai-auth-token')
      if (!token) {
        console.error('❌ No auth token found')
        setSaved('error')
        return
      }

      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        activity_level: form.activityLevel.toLowerCase().replace(/\s+/g, '_'),
        goal: form.goal.toLowerCase().replace(/\s+/g, '_'),
      }
      
      console.log('📤 Sending profile update to backend...')
      console.log('Payload:', JSON.stringify(payload))
      console.log('Token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log(`Response status: ${response.status}`)
      const responseText = await response.text()
      console.log('Raw response:', responseText)

      if (!response.ok) {
        let errorMessage = 'Profile update failed'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          errorMessage = responseText || errorMessage
        }
        console.error('❌ Backend error:', errorMessage)
        setSaveError(errorMessage)
        setSaved('error')
        return
      }

      // Simultaneously update reminder status
      try {
        await fetch('/api/toggle-reminder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ enabled: reminderEnabled })
        })
      } catch (_e) {
        console.warn('Failed to update reminder toggle:', _e)
      }

      let responseData = {}
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.warn('Could not parse response as JSON:', parseError)
        responseData = { detail: 'Success' }
      }
      
      console.log('✅ Backend response:', responseData)

      const localProfile = mapFormToLocalProfile(form)
      if (typeof responseData?.data?.profile_completed === 'boolean') {
        localProfile.profileCompleted = responseData.data.profile_completed
      }
      syncProfileCompletionFlag(localProfile)
      console.log('💾 Profile saved to localStorage with completion flag')

      // ── Regenerate + store the Spoonacular meal plan so the dashboard,
      //    Next Meal card, and SMTP reminders all use the updated profile. ──
      try {
        const syncResp = await fetch('/api/diet/sync-meal-plan', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const syncData = await syncResp.json()
        if (syncData.success) {
          console.log('✅ Meal plan synced to backend:', syncData.data?.meal_plan?.length, 'days')
        } else {
          console.warn('⚠️ Meal plan sync returned error:', syncData.detail)
        }
      } catch (syncErr) {
        // Non-fatal — dashboard will still load via Spoonacular GET
        console.warn('⚠️ Meal plan sync failed (non-fatal):', syncErr.message)
      }

      // Invalidate the frontend cache so all subscribers re-render with the
      // new plan immediately without waiting for the next page load.
      await invalidateMealCache()

      setSaved('success')
      window.dispatchEvent(new Event('nutriai-profile-updated'))

      setTimeout(() => {
        navigate('/home')
      }, 1200)
    } catch (error) {
      console.error('❌ Profile save error:', error.message)
      setSaveError(error.message || 'Error saving profile. Please try again.')
      setSaved('error')
    }
  }


  if (loading) {
    return (
      <section className="min-h-[calc(100vh-96px)] bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-96px)] bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white">
            {String(form.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-sm text-slate-500">Manage your body metrics and nutrition targets.</p>
        </div>

        <form onSubmit={onSave} className="grid gap-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Age" name="age" type="number" value={form.age} onChange={handleChange} />
            <Select label="Gender" name="gender" value={form.gender} onChange={handleChange} options={['Select gender', 'Female', 'Male', 'Non-binary', 'Prefer not to say']} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} />
            <Input label="Weight (kg)" name="weight" type="number" value={form.weight} onChange={handleChange} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Weight Card (Goal)</label>
              <button 
                type="button"
                onClick={analyzeGoal}
                disabled={analyzing || !form.height || !form.weight}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'AI Recommend'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {goals.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, goal: g }))}
                  className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${
                    form.goal === g 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {aiRecommendation && (
              <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
                <span className="font-bold">AI Note:</span> {aiRecommendation.reason}
              </p>
            )}
          </div>

          <Select label="Activity Level" name="activityLevel" value={form.activityLevel} onChange={handleChange} options={levels} />

          <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:grid-cols-2">
            <InfoTile title="BMI" value={bmi ? bmi.toFixed(1) : '--'} />
            <InfoTile title="Daily Calorie Target" value={`${calorieTarget} kcal`} />
          </div>

          <button 
            type="submit" 
            disabled={saved === 'saving'}
            className="btn-green ripple mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved === 'saving' ? 'Saving...' : 'Save Profile'}
          </button>

          {saved === 'success' ? <p className="text-center text-sm font-semibold text-emerald-700">✓ Profile saved! Redirecting to meal planner...</p> : null}
          {saved === 'error' && saveError ? (
            <p className="text-center text-sm font-semibold text-red-600">{saveError}</p>
          ) : null}

          {/* Email Reminders Toggle */}
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-left transition duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-100">
                  <FaBell className={reminderEnabled ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Weekly Email Reminders</h3>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Receive breakfast, lunch, and dinner alerts 3 times a day <br className="hidden sm:block" />
                    based on your 7-day meal schedule.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                   setReminderEnabled(!reminderEnabled);
                   setSaved(false);
                }}
                className={`relative flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  reminderEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ease-in-out ${
                    reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {reminderEnabled && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-[11px] font-semibold text-blue-700">
                   <FaInfoCircle className="animate-pulse" />
                   Setup tip: Use a Gmail App Password for SMTP to avoid authentication failures.
                </div>
            )}
          </div>

          {/* 7-Day Meal Plan Manager */}
          <MealPlanManager 
             goal="maintain" 
             calories={calorieTarget} 
          />
        </form>
      </motion.div>
    </section>
  )
}


function Input({ label, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className="rounded-xl border border-emerald-100 px-3 py-2.5 text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function Select({ label, options, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function InfoTile({ title, value }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-3 text-center">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  )
}
