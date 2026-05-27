import { useNavigate, useLocation } from 'react-router-dom'
import './AuthPrompt.css'

/**
 * AuthPrompt – a modal overlay shown to guest (unauthenticated) users
 * when they try to submit answers or view solutions.
 * Redirects to /login with a ?redirect= param so users return to the same problem.
 */
export default function AuthPrompt({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Include the current URL as a redirect parameter so we return here after login
  const redirectUrl = encodeURIComponent(location.pathname + location.search)

  function handleLogin() {
    navigate(`/login?redirect=${redirectUrl}`)
    onClose()
  }

  return (
    <div className="auth-prompt-overlay" onClick={onClose}>
      <div className="auth-prompt-card" onClick={e => e.stopPropagation()}>
        <div className="auth-prompt-icon">🔐</div>
        <h2 className="auth-prompt-title">Sign in to Continue</h2>
        <p className="auth-prompt-body">
          Create a free account to submit answers, track your Elo rating,
          save your progress, and view official solutions.
        </p>
        <div className="auth-prompt-actions">
          <button className="auth-prompt-btn-primary" onClick={handleLogin}>
            Log In / Sign Up
          </button>
          <button className="auth-prompt-btn-secondary" onClick={onClose}>
            Continue as Guest
          </button>
        </div>
        <p className="auth-prompt-hint">
          In guest mode, submissions and solutions are locked.
        </p>
      </div>
    </div>
  )
}
