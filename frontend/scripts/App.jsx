import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import SplashScreen from '../components/SplashScreen'
import LoginPage from '../pages/LoginPage'
import SignInPage from '../pages/SignInPage'
import Home from '../pages/Home'
import ProfilePage from '../pages/ProfilePage.jsx'
import ProfileCompletionReminder from '../components/ProfileCompletionReminder'
import {
  clearProfileReminderMutedUntil,
  fetchAndSyncProfile,
  getProfileCompletionState,
  readStoredProfile,
  setProfileReminderMutedUntil,
  syncProfileCompletionFlag,
} from './profileCompletion'

const REMINDER_COOLDOWN_MS = 5 * 60 * 1000

function SplashRoute({ isAuthenticated }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate(isAuthenticated ? '/home' : '/login', { replace: true })
    }, 2500)

    return () => clearTimeout(timeout)
  }, [isAuthenticated, navigate])

  return <SplashScreen />
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return children
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('nutriai-auth') === 'true',
  )
  const [profileState, setProfileState] = useState(() => getProfileCompletionState())

  const [showReminder, setShowReminder] = useState(false)

  const profileCompleted = profileState.profileCompleted

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const token = localStorage.getItem('nutriai-auth-token')
    fetchAndSyncProfile(token).then((completionState) => {
      setProfileState(completionState)
      if (completionState.profileCompleted) {
        clearProfileReminderMutedUntil()
      }
    })

    return undefined
  }, [isAuthenticated])

  useEffect(() => {
    const handleProfileUpdate = () => {
      const completionState = syncProfileCompletionFlag(readStoredProfile())
      setProfileState(completionState)

      if (completionState.profileCompleted) {
        clearProfileReminderMutedUntil()
      }
    }

    const handleStorageUpdate = (event) => {
      if (event.key === 'nutriai-profile' || event.key === 'nutriai-profile-reminder-muted-until') {
        const completionState = syncProfileCompletionFlag(readStoredProfile())
        setProfileState(completionState)
      }
    }

    window.addEventListener('nutriai-profile-updated', handleProfileUpdate)
    window.addEventListener('storage', handleStorageUpdate)

    return () => {
      window.removeEventListener('nutriai-profile-updated', handleProfileUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || profileCompleted || location.pathname === '/profile') {
      return undefined
    }

    return undefined
  }, [isAuthenticated, location.pathname, profileCompleted])

  const isReminderOpen =
    isAuthenticated &&
    !profileCompleted &&
    location.pathname !== '/profile' &&
    showReminder

  const handleAuthSuccess = async () => {
    localStorage.setItem('nutriai-auth', 'true')
    setIsAuthenticated(true)
    const token = localStorage.getItem('nutriai-auth-token')
    const completionState = await fetchAndSyncProfile(token)
    setProfileState(completionState)
    if (completionState.profileCompleted) {
      clearProfileReminderMutedUntil()
      setShowReminder(false)
    } else {
      setShowReminder(true)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('nutriai-auth')
    setIsAuthenticated(false)
  }

  const handleCompleteProfile = () => {
    setShowReminder(false)
    navigate('/profile')
  }

  const handleLater = () => {
    setShowReminder(false)
    const mutedUntil = Date.now() + REMINDER_COOLDOWN_MS
    setProfileReminderMutedUntil(mutedUntil)
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<SplashRoute isAuthenticated={isAuthenticated} />} />
        <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/signin" element={<SignInPage onAuthSuccess={handleAuthSuccess} />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home
                onSignOut={handleSignOut}
                profileCompletion={profileState}
                onCompleteProfile={handleCompleteProfile}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage onSignOut={handleSignOut} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ProfileCompletionReminder
        open={isReminderOpen}
        completionPercent={profileState.completionPercent}
        missingRequiredFields={profileState.missingRequiredFields}
        optionalMissingFields={profileState.optionalMissingFields}
        onCompleteProfile={handleCompleteProfile}
        onLater={handleLater}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
