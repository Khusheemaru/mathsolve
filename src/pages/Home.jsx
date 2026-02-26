import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const features = [
  { icon: '🎲', title: 'Random Problem Generator', desc: 'Filter by category and difficulty, or go completely random. A new challenge is always one click away.' },
  { icon: '📊', title: 'Global Leaderboard', desc: 'Compete with mathematicians worldwide. Your ELO rating grows with every problem you conquer.' },
  { icon: '✏️', title: 'Digital Scratchpad', desc: 'Freehand drawing canvas to work through geometry, diagrams, and rough calculations — right in the browser.' },
  { icon: '📝', title: 'Personal Vault', desc: 'Save your approach and custom notes for every problem you solve. Your personal math reference library.' },
  { icon: '📖', title: 'Official Solutions', desc: 'Stuck? Reveal the official solution and still earn +75 pts by submitting the correct answer.' },
  { icon: '🏆', title: 'Weekly Contests', desc: 'A new set of 5 problems drops every Monday. Solve them by Sunday to climb the weekly leaderboard.' },
]

const categories = [
  { name: 'Calculus', emoji: '∫', color: '#2563eb' },
  { name: 'Number Theory', emoji: '#', color: '#7c3aed' },
  { name: 'Combinatorics', emoji: '⊕', color: '#16a34a' },
  { name: 'Probability', emoji: '∿', color: '#d97706' },
  { name: 'Geometry', emoji: '△', color: '#dc2626' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">Math • Puzzles • Olympiad</div>
        <h1 className="hero-title">Keep Your <span className="hero-highlight">Math Edge</span> Sharp</h1>
        <p className="hero-subtitle">
          A curated collection of problems from IMO, AIME, AMC, Putnam and beyond.
          Practice daily, compete globally, understand deeply.
        </p>
        <div className="hero-actions">
          <Link to="/solve" className="btn-hero-primary">Start Solving</Link>
          {!user && <Link to="/login" className="btn-hero-outline">Create Account</Link>}
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="stat-num">500+</span><span className="stat-desc">Problems</span></div>
          <div className="hero-divider" />
          <div className="hero-stat"><span className="stat-num">5</span><span className="stat-desc">Categories</span></div>
          <div className="hero-divider" />
          <div className="hero-stat"><span className="stat-num">10</span><span className="stat-desc">Difficulty Levels</span></div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Explore by Category</h2>
          <div className="category-grid">
            {categories.map(c => (
              <Link to={`/solve?category=${c.name.toUpperCase().replace(' ', '+')}`} key={c.name} className="category-card">
                <span className="category-emoji" style={{ color: c.color }}>{c.emoji}</span>
                <span className="category-name">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title">Everything You Need</h2>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to solve?</h2>
          <p className="cta-sub">Join the community of math enthusiasts. Free forever.</p>
          <Link to="/solve" className="btn-hero-primary">Pick a Problem →</Link>
        </div>
      </section>
    </div>
  )
}
