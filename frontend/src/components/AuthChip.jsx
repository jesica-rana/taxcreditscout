import { Link, useNavigate } from 'react-router-dom'
import { signOut, useAuth } from '../lib/auth.js'

// Compact user chip for the top-right of authenticated pages.
// Shows email + sign-out, plus a link to the dashboard.
export default function AuthChip() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const label = user.name || user.email

  return (
    <div className="auth-chip">
      <Link to="/dashboard" className="auth-chip-link">My reports</Link>
      <span className="auth-chip-divider" aria-hidden="true">·</span>
      <span className="auth-chip-email" title={user.email}>{label}</span>
      <button type="button" onClick={handleSignOut} className="auth-chip-out">
        Sign out
      </button>
    </div>
  )
}
