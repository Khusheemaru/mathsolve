import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const RANK_COLORS = {
  Bronze: '#b45309',
  Silver: '#6b7280',
  Gold: '#f59e0b',
  Platinum: '#7c3aed',
  Diamond: '#2563eb',
}

function getRank(score) {
  if (score >= 5000) return 'Diamond'
  if (score >= 2500) return 'Platinum'
  if (score >= 1000) return 'Gold'
  if (score >= 400) return 'Silver'
  return 'Bronze'
}

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const rank = profile ? getRank(profile.total_score) : 'Bronze'
  const rankColor = RANK_COLORS[rank]

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <div className="logo-icon">Σ</div>
          <span className="logo-text">MathSolve</span>
        </Link>

        <nav className="header-nav">
          <Link to="/solve" className={`nav-link ${location.pathname === '/solve' ? 'active' : ''}`}>Solve</Link>
          <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>Leaderboard</Link>
          {user && <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>History</Link>}
        </nav>

        <div className="header-right">
          {user && profile ? (
            <>
              <div className="user-stats">
                <span className="stat-label">Points:</span>
                <span className="stat-value">{profile.total_score.toLocaleString()} pts</span>
                <span className="stat-divider">·</span>
                <span className="stat-label">Rank:</span>
                <span className="rank-badge" style={{ color: rankColor }}>{rank}</span>
              </div>
              <button className="btn-outline-sm" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary-sm">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  )
}
