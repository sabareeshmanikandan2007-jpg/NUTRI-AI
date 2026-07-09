import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import DashboardCards from '../components/DashboardCards'
import NutritionDashboard from '../components/NutritionDashboard'
import ChatbotWidget from '../components/ChatbotWidget'
import Footer from '../components/Footer'
import ProfileCompletionBanner from '../components/ProfileCompletionBanner'
import ProfileLockPanel from '../components/ProfileLockPanel'
import { useState, useEffect } from 'react'

export default function Home({ onSignOut, profileCompletion, onCompleteProfile }) {
  const [tracker, setTracker] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const profileComplete = profileCompletion?.profileCompleted ?? true
  const completionPercent = profileCompletion?.completionPercent ?? 0

  // Load daily meals from backend on mount
  useEffect(() => {
    const loadDailyMeals = async () => {
      try {
        const token = localStorage.getItem('nutriai-auth-token')
        if (!token) return

        const response = await fetch('/api/food/daily-calories', {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        const nutrition = data?.data || {}

        setTracker({
          calories: Number(nutrition.total_calories || 0),
          protein: Number(nutrition.total_protein || 0),
          carbs: Number(nutrition.total_carbs || 0),
          fat: Number(nutrition.total_fat || 0),
        })
      } catch (error) {
        console.error('Failed to load daily meals:', error)
      }
    }

    loadDailyMeals()

    // Refresh every 30 seconds to stay in sync
    const interval = setInterval(loadDailyMeals, 30000)

    // Also listen for profile updates
    const handleProfileUpdate = loadDailyMeals
    window.addEventListener('nutriai-profile-updated', handleProfileUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('nutriai-profile-updated', handleProfileUpdate)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-800">
      <Navbar onSignOut={onSignOut} />
      {!profileComplete ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:pt-8">
          <ProfileCompletionBanner
            completionPercent={completionPercent}
            onCompleteProfile={onCompleteProfile}
          />
        </div>
      ) : null}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:py-8">
        <HeroSection />
        {profileComplete ? (
          <DashboardCards tracker={tracker} profileComplete={profileComplete} onCompleteProfile={onCompleteProfile} />
        ) : (
          <ProfileLockPanel
            title="Personalized dashboard locked"
            message="Complete your profile with name, age, gender, height, weight, and activity level to unlock meal plans, calorie tracking, and dashboard insights."
            onCompleteProfile={onCompleteProfile}
          />
        )}
        {profileComplete ? (
          <NutritionDashboard />
        ) : (
          <ProfileLockPanel
            title="Nutrition Dashboard Locked"
            message="Complete your profile to unlock personalized calorie burn stats, 7-day meal plan (via Spoonacular), and exercise recommendations."
            onCompleteProfile={onCompleteProfile}
          />
        )}
        <Footer />
      </main>
      <ChatbotWidget profileComplete={profileComplete} onCompleteProfile={onCompleteProfile} />
    </div>
  )
}
