import Navbar from '../components/Navbar'
import ProfilePageComponent from '../components/ProfilePage.jsx'

export default function ProfilePage({ onSignOut }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-800">
      <Navbar onSignOut={onSignOut} />
      <ProfilePageComponent />
    </div>
  )
}
