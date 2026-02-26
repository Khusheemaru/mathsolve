import { useState, useEffect, useCallback } from 'react'
import katex from 'katex'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Scratchpad from '../components/Scratchpad'
import './Solve.css'

const DEMO_PROBLEMS = [
  {
    id: 'demo-1',
    source: 'Classic Calculus',
    category: 'CALCULUS',
    difficulty: 4,
    statement_latex: '\\int_0^{\\infty} \\frac{\\sin(x)}{x}\\, dx',
    question_text: 'Evaluate the Dirichlet integral above.',
    solution_latex: 'Using the Laplace transform or Feynman\'s technique, we find: \\int_0^{\\infty} \\frac{\\sin(x)}{x}\\, dx = \\frac{\\pi}{2}',
    final_answer: 'pi/2'
  },
  {
    id: 'demo-2',
    source: 'AMC 2022',
    category: 'NUMBER THEORY',
    difficulty: 5,
    statement_latex: '\\text{Find the last two digits of } 7^{2022}',
    question_text: 'Find the last two digits of 7²⁰²².',
    solution_latex: '7^{2022} \\pmod{100}: \\text{ The order of 7 mod 100 is 20. } 2022 = 20 \\times 101 + 2, \\text{ so } 7^{2022} \\equiv 7^2 = 49.',
    final_answer: '49'
  },
  {
    id: 'demo-3',
    source: 'IMO 1972',
    category: 'COMBINATORICS',
    difficulty: 6,
    statement_latex: '\\text{How many ways can you arrange 8 non-attacking rooks on a standard 8×8 chessboard?}',
    question_text: 'Count the number of ways to place 8 non-attacking rooks on a standard 8×8 chessboard.',
    solution_latex: 'Each row must contain exactly one rook, and no two rooks can share a column. This is equivalent to counting permutations of 8 columns: 8! = 40320.',
    final_answer: '40320'
  },
  {
    id: 'demo-4',
    source: 'Putnam 2019',
    category: 'PROBABILITY',
    difficulty: 5,
    statement_latex: '\\text{Two fair dice are rolled. What is the probability that the sum is a prime?}',
    question_text: 'Two fair dice are rolled. What is the probability that the sum is a prime number? Express as a fraction.',
    solution_latex: 'Primes possible: 2,3,5,7,11. Count favorable: (1,1)=2✓, (1,2),(2,1)=3✓, (1,4),(2,3),(3,2),(4,1)=5✓, (1,6),(2,5),(3,4),(4,3),(5,2),(6,1)=7✓, (5,6),(6,5)=11✓. Total=15, P=15/36=5/12.',
    final_answer: '5/12'
  },
  {
    id: 'demo-5',
    source: 'AIME 2021 I',
    category: 'GEOMETRY',
    difficulty: 7,
    statement_latex: '\\text{A circle of radius } r \\text{ is inscribed in a right triangle with legs 9 and 40. Find } r.',
    question_text: 'A circle is inscribed in a right triangle with legs 9 and 40. Find the radius of the inscribed circle.',
    solution_latex: 'Hypotenuse = \\sqrt{81+1600} = 41. For inscribed circle: r = (a+b-c)/2 = (9+40-41)/2 = 8/2 = 4.',
    final_answer: '4'
  }
]

function renderLatex(latex, display = false) {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: false })
  } catch {
    return latex
  }
}

export default function Solve() {
  const { user, profile, fetchProfile } = useAuth()
  const [problem, setProblem] = useState(null)
  const [answer, setAnswer] = useState('')
  const [notes, setNotes] = useState('')
  const [scratchpadData, setScratchpadData] = useState(null)
  const [status, setStatus] = useState(null) // null | 'correct' | 'wrong' | 'solution_shown'
  const [solutionVisible, setSolutionVisible] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ category: 'ALL', difficulty: 'ALL' })
  const [submitting, setSubmitting] = useState(false)

  const categories = ['ALL', 'CALCULUS', 'NUMBER THEORY', 'COMBINATORICS', 'PROBABILITY', 'GEOMETRY']
  const difficulties = ['ALL', '1-3', '4-6', '7-10']

  const fetchProblem = useCallback(async () => {
    setLoading(true)
    setAnswer('')
    setNotes('')
    setScratchpadData(null)
    setStatus(null)
    setSolutionVisible(false)
    setPointsEarned(null)

    try {
      let query = supabase.from('problems').select('*')
      if (filters.category !== 'ALL') query = query.eq('category', filters.category)
      if (filters.difficulty === '1-3') query = query.gte('difficulty', 1).lte('difficulty', 3)
      else if (filters.difficulty === '4-6') query = query.gte('difficulty', 4).lte('difficulty', 6)
      else if (filters.difficulty === '7-10') query = query.gte('difficulty', 7).lte('difficulty', 10)

      const { data, error } = await query
      if (error || !data || data.length === 0) {
        // Fallback to demo problems
        let pool = DEMO_PROBLEMS
        if (filters.category !== 'ALL') pool = pool.filter(p => p.category === filters.category)
        setProblem(pool[Math.floor(Math.random() * pool.length)])
      } else {
        const rand = data[Math.floor(Math.random() * data.length)]
        setProblem(rand)
      }
    } catch {
      const pool = DEMO_PROBLEMS
      setProblem(pool[Math.floor(Math.random() * pool.length)])
    }

    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchProblem()
  }, [])

  // Load vault data when problem changes
  useEffect(() => {
    if (!user || !problem || problem.id.startsWith('demo')) return
    async function loadVault() {
      const { data } = await supabase
        .from('vault')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('problem_id', problem.id)
        .single()
      if (data) {
        setNotes(data.notes || '')
        setScratchpadData(data.scratchpad_data || null)
      }
    }
    loadVault()
  }, [user, problem])

  async function saveVault() {
    if (!user || !problem || problem.id.startsWith('demo')) return
    await supabase.from('vault').upsert({
      user_id: user.user_id,
      problem_id: problem.id,
      notes,
      scratchpad_data: scratchpadData
    }, { onConflict: 'user_id,problem_id' })
  }

  async function handleSubmit() {
    if (!answer.trim() || !problem) return
    setSubmitting(true)

    const normalize = (s) => s.trim().toLowerCase().replace(/\s/g, '').replace(/×/g, '*')
    const isCorrect = normalize(answer) === normalize(problem.final_answer)

    if (!isCorrect) {
      setStatus('wrong')
      setSubmitting(false)
      return
    }

    const pts = solutionVisible ? 75 : 100
    setPointsEarned(pts)
    setStatus(solutionVisible ? 'correct_with_solution' : 'correct')

    if (user && !problem.id.startsWith('demo')) {
      await supabase.from('submissions').insert({
        user_id: user.user_id,
        problem_id: problem.id,
        status: solutionVisible ? 'SOLVED_WITH_SOLUTION' : 'SOLVED_INDEPENDENTLY',
        points_earned: pts
      })
      await supabase.from('profiles')
        .update({ total_score: (profile?.total_score || 0) + pts })
        .eq('user_id', user.user_id)
      await fetchProfile(user.user_id)
      await saveVault()
    }

    setSubmitting(false)
  }

  function handleShowSolution() {
    setSolutionVisible(true)
  }

  const difficultyLabel = (d) => {
    if (d <= 3) return { text: 'Easy', color: '#16a34a' }
    if (d <= 6) return { text: 'Medium', color: '#d97706' }
    return { text: 'Hard', color: '#dc2626' }
  }

  const quotes = [
    '"Pure mathematics is, in its way, the poetry of logical ideas." — Albert Einstein',
    '"Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding." — William Paul Thurston',
    '"The only way to learn mathematics is to do mathematics." — Paul Halmos'
  ]
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length]

  return (
    <div className="solve-page">
      {/* Filters */}
      <div className="filters-bar">
        <div className="filters-inner">
          <div className="filter-group">
            <span className="filter-label">Category</span>
            <div className="filter-pills">
              {categories.map(c => (
                <button
                  key={c}
                  className={`pill ${filters.category === c ? 'active' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, category: c }))}
                >{c === 'ALL' ? 'All Categories' : c}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">Difficulty</span>
            <div className="filter-pills">
              {difficulties.map(d => (
                <button
                  key={d}
                  className={`pill ${filters.difficulty === d ? 'active' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, difficulty: d }))}
                >{d === 'ALL' ? 'Any Difficulty' : `Level ${d}`}</button>
              ))}
            </div>
          </div>
          <button className="btn-randomize" onClick={fetchProblem} disabled={loading}>
            {loading ? 'Loading...' : '🎲 Random Problem'}
          </button>
        </div>
      </div>

      <div className="solve-main">
        {/* Left: Problem */}
        <div className="problem-section">
          {loading ? (
            <div className="problem-loading">
              <div className="spinner" />
              <p>Fetching a problem…</p>
            </div>
          ) : problem ? (
            <div className="problem-card">
              <div className="problem-meta">
                <span className="category-tag">{problem.category}</span>
                <span className="bullet">·</span>
                <span className="difficulty-tag" style={{ color: difficultyLabel(problem.difficulty).color }}>
                  LEVEL {problem.difficulty} — {difficultyLabel(problem.difficulty).text.toUpperCase()}
                </span>
                {problem.source && (
                  <>
                    <span className="bullet">·</span>
                    <span className="source-tag">{problem.source}</span>
                  </>
                )}
              </div>

              <div
                className="problem-statement-math"
                dangerouslySetInnerHTML={{ __html: renderLatex(problem.statement_latex, true) }}
              />
              <p className="problem-question">{problem.question_text}</p>

              {/* Solution reveal */}
              {solutionVisible && (
                <div className="solution-box">
                  <p className="solution-label">Official Solution</p>
                  <div
                    dangerouslySetInnerHTML={{ __html: renderLatex(problem.solution_latex, false) }}
                    className="solution-content"
                  />
                  <p className="solution-note">Submit the correct answer to earn <strong>+75 pts</strong></p>
                </div>
              )}

              {/* Status messages */}
              {status === 'correct' && (
                <div className="status-msg success">
                  ✓ Correct! You earned <strong>+{pointsEarned} pts</strong>
                </div>
              )}
              {status === 'correct_with_solution' && (
                <div className="status-msg success">
                  ✓ Correct! You earned <strong>+{pointsEarned} pts</strong> (solution was shown)
                </div>
              )}
              {status === 'wrong' && (
                <div className="status-msg error">
                  ✗ Incorrect. Try again or view the solution.
                </div>
              )}

              {/* Answer input */}
              {status !== 'correct' && status !== 'correct_with_solution' && (
                <>
                  <input
                    className="answer-input"
                    type="text"
                    placeholder="Enter your answer…"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    disabled={submitting}
                  />
                  <button
                    className="btn-submit"
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitting}
                  >
                    {submitting ? 'Checking…' : 'Submit Solution'}
                  </button>

                  {!solutionVisible && (
                    <button className="btn-show-solution" onClick={handleShowSolution}>
                      Show Solution
                    </button>
                  )}
                </>
              )}

              {(status === 'correct' || status === 'correct_with_solution') && (
                <button className="btn-next" onClick={fetchProblem}>Next Problem →</button>
              )}

              <p className="quote-text">{quote}</p>
            </div>
          ) : null}
        </div>

        {/* Right: Sidebar */}
        <div className="sidebar">
          <Scratchpad savedData={scratchpadData} onDataChange={setScratchpadData} />

          <div className="notes-panel">
            <div className="notes-header">
              <span className="notes-title">NOTES</span>
              {user && (
                <button className="save-notes-btn" onClick={saveVault}>Save</button>
              )}
            </div>
            <textarea
              className="notes-textarea"
              placeholder="Jot down formulas, ideas, or your approach…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {!user && (
            <div className="login-nudge">
              <p>Sign in to save notes, track progress, and appear on the leaderboard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
