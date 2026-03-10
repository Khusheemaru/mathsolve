import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LatexText from '../components/LatexText'
import './Archive.css'

const PAGE_SIZE = 50

const STATUS_MAP = {
  SOLVED_INDEPENDENTLY: { icon: '🟢', label: 'Solved' },
  SOLVED_WITH_SOLUTION: { icon: '🟡', label: 'With Solution' },
  FAILED: { icon: '🔴', label: 'Failed' },
}

const CATEGORIES = ['ALL', 'ALGEBRA', 'NUMBER THEORY', 'GEOMETRY', 'PROBABILITY', 'ARITHMETIC', 'CALCULUS']
const DIFFICULTIES = ['ALL', '1-3', '4-6', '7-10']
const STATUSES = ['ALL', 'UNSOLVED', 'SOLVED']

export default function Archive() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [problems, setProblems] = useState([])
  const [solvedMap, setSolvedMap] = useState({}) // problem_id → submission status
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ category: 'ALL', difficulty: 'ALL', status: 'ALL' })

  // Fetch problems for current page
  useEffect(() => {
    async function load() {
      setLoading(true)

      let query = supabase.from('problems').select('id, source, category, difficulty, statement_latex', { count: 'exact' })

      if (filters.category !== 'ALL') query = query.eq('category', filters.category)
      if (filters.difficulty === '1-3') query = query.gte('difficulty', 1).lte('difficulty', 3)
      else if (filters.difficulty === '4-6') query = query.gte('difficulty', 4).lte('difficulty', 6)
      else if (filters.difficulty === '7-10') query = query.gte('difficulty', 7).lte('difficulty', 10)

      query = query
        .order('difficulty', { ascending: true })
        .order('category', { ascending: true })
        .order('id', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      const { data, error, count } = await query
      if (!error && data) {
        setProblems(data)
        setTotal(count || 0)
      }

      // Fetch user's submissions for these problem IDs to show status
      if (user && data && data.length > 0) {
        const ids = data.map(p => p.id)
        const { data: subs } = await supabase
          .from('submissions')
          .select('problem_id, status')
          .eq('user_id', user.user_id)
          .in('problem_id', ids)

        if (subs) {
          const map = {}
          for (const s of subs) map[s.problem_id] = s.status
          setSolvedMap(prev => ({ ...prev, ...map }))
        }
      }
      setLoading(false)
    }
    load()
  }, [page, filters, user])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const difficultyLabel = (d) => {
    if (d <= 3) return { text: 'Easy', cls: 'diff-easy' }
    if (d <= 6) return { text: 'Med', cls: 'diff-med' }
    return { text: 'Hard', cls: 'diff-hard' }
  }

  // Truncate LaTeX to reasonable length for the table preview
  const truncate = (str, n = 80) => str && str.length > n ? str.slice(0, n) + '…' : str

  return (
    <div className="archive-page">
      <div className="archive-header">
        <h1 className="archive-title">Problem Archive</h1>
        <p className="archive-subtitle">
          {total.toLocaleString()} problems · Solve systematically or click any problem to start.
        </p>
      </div>

      {/* Filters */}
      <div className="archive-filters">
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="filter-pills">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`pill${filters.category === c ? ' active' : ''}`}
                onClick={() => { setFilters(f => ({ ...f, category: c })); setPage(0) }}
              >{c === 'ALL' ? 'All' : c}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Difficulty</span>
          <div className="filter-pills">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`pill${filters.difficulty === d ? ' active' : ''}`}
                onClick={() => { setFilters(f => ({ ...f, difficulty: d })); setPage(0) }}
              >{d === 'ALL' ? 'Any' : `Lv ${d}`}</button>
            ))}
          </div>
        </div>
        {user && (
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <div className="filter-pills">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`pill${filters.status === s ? ' active' : ''}`}
                  onClick={() => { setFilters(f => ({ ...f, status: s })); setPage(0) }}
                >{s === 'ALL' ? 'All' : s === 'SOLVED' ? '🟢 Solved' : '⚪ Unsolved'}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="archive-loading"><div className="spinner" /><p>Loading problems…</p></div>
      ) : (
        <div className="archive-table-wrap">
          <table className="archive-table">
            <thead>
              <tr>
                <th>#</th>
                {user && <th>Status</th>}
                <th>Problem</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => {
                const sub = solvedMap[p.id]
                const statusInfo = sub ? STATUS_MAP[sub] : { icon: '⚪', label: 'Unsolved' }
                const diff = difficultyLabel(p.difficulty)
                return (
                  <tr key={p.id} className="archive-row" onClick={() => navigate(`/solve?id=${p.id}`)}>
                    <td className="archive-num">{page * PAGE_SIZE + i + 1}</td>
                    {user && (
                      <td className="archive-status" title={statusInfo.label}>
                        {statusInfo.icon}
                      </td>
                    )}
                    <td className="archive-statement">
                      <div className="archive-statement-inner">
                        <LatexText text={p.statement_latex} />
                      </div>
                    </td>
                    <td><span className="cat-badge">{p.category}</span></td>
                    <td><span className={`diff-badge ${diff.cls}`}>Lv {p.difficulty} · {diff.text}</span></td>
                    <td className="archive-source">{p.source}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="archive-pagination">
        <button
          className="page-btn"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >← Prev</button>
        <span className="page-info">Page {page + 1} of {totalPages}</span>
        <button
          className="page-btn"
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >Next →</button>
      </div>
    </div>
  )
}
