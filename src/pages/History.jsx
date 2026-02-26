import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './History.css'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    async function fetchHistory() {
      const { data } = await supabase
        .from('submissions')
        .select('*, problems(category, difficulty, question_text, source)')
        .eq('user_id', user.user_id)
        .order('submitted_at', { ascending: false })
        .limit(50)
      setHistory(data || [])
      setLoading(false)
    }
    fetchHistory()
  }, [user])

  const statusLabel = { SOLVED_INDEPENDENTLY: { text: 'Solved', color: '#16a34a', bg: '#f0fdf4' }, SOLVED_WITH_SOLUTION: { text: 'Solution Used', color: '#d97706', bg: '#fffbeb' }, FAILED: { text: 'Failed', color: '#dc2626', bg: '#fef2f2' } }

  return (
    <div className="history-page">
      <div className="history-inner">
        <h1 className="history-title">Your Math History</h1>
        <p className="history-sub">Every problem you've worked on — your personal vault.</p>

        {loading ? (
          <p className="history-loading">Loading your history…</p>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <p>No problems solved yet.</p>
            <a href="/solve">Start solving →</a>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const p = item.problems
              const s = statusLabel[item.status] || statusLabel['FAILED']
              return (
                <div key={item.id} className="history-item">
                  <div className="history-item-left">
                    <span className="h-category">{p?.category || 'Math'}</span>
                    <p className="h-question">{p?.question_text || 'Problem'}</p>
                    <span className="h-source">{p?.source || ''}</span>
                  </div>
                  <div className="history-item-right">
                    <span className="h-status" style={{ color: s.color, background: s.bg }}>{s.text}</span>
                    <span className="h-points">+{item.points_earned} pts</span>
                    <span className="h-date">{new Date(item.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
