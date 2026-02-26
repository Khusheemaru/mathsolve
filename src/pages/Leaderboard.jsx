import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Leaderboard.css'

const RANK_COLORS = { Bronze: '#b45309', Silver: '#6b7280', Gold: '#f59e0b', Platinum: '#7c3aed', Diamond: '#2563eb' }
function getRank(score) {
  if (score >= 5000) return 'Diamond'
  if (score >= 2500) return 'Platinum'
  if (score >= 1000) return 'Gold'
  if (score >= 400) return 'Silver'
  return 'Bronze'
}

const DEMO_LEADERS = [
  { username: 'euler_reborn', total_score: 6820, elo_rating: 2180 },
  { username: 'primeHunter', total_score: 5410, elo_rating: 2050 },
  { username: 'calculus_god', total_score: 4900, elo_rating: 1980 },
  { username: 'infinite_series', total_score: 3750, elo_rating: 1870 },
  { username: 'ramanujan_fan', total_score: 3100, elo_rating: 1800 },
  { username: 'vectorspace', total_score: 2550, elo_rating: 1730 },
  { username: 'modular_mage', total_score: 2100, elo_rating: 1650 },
  { username: 'dirichlet99', total_score: 1680, elo_rating: 1560 },
  { username: 'proofbycontrad', total_score: 1250, elo_rating: 1500 },
  { username: 'topoloPher', total_score: 820, elo_rating: 1420 },
]

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, total_score, elo_rating')
          .order('total_score', { ascending: false })
          .limit(50)
        if (error || !data || data.length === 0) setLeaders(DEMO_LEADERS)
        else setLeaders(data)
      } catch { setLeaders(DEMO_LEADERS) }
      setLoading(false)
    }
    fetchLeaders()
  }, [])

  return (
    <div className="lb-page">
      <div className="lb-inner">
        <div className="lb-header">
          <h1 className="lb-title">Global Leaderboard</h1>
          <p className="lb-sub">Top mathematicians ranked by total score</p>
        </div>

        {loading ? <div className="lb-loading">Loading rankings…</div> : (
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Rank</th>
                  <th>ELO</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((p, i) => {
                  const rank = getRank(p.total_score)
                  return (
                    <tr key={p.username} className={i < 3 ? `top-${i+1}` : ''}>
                      <td className="rank-num">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="username">{p.username}</td>
                      <td>
                        <span className="rank-pill" style={{ color: RANK_COLORS[rank], background: `${RANK_COLORS[rank]}18` }}>
                          {rank}
                        </span>
                      </td>
                      <td className="elo">{p.elo_rating}</td>
                      <td className="score">{p.total_score.toLocaleString()} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
