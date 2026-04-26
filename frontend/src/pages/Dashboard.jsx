import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../strata.css'
import AuthChip from '../components/AuthChip.jsx'
import { useRequireAuth } from '../lib/auth.js'

function LogoMark() {
  return (
    <span className="logo-mark" style={{ display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <ellipse cx="16" cy="11" rx="12" ry="2.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d="M 4 11 Q 4 26 16 26 Q 28 26 28 11" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="11" cy="17" r="1.6" fill="var(--accent)" />
        <circle cx="16" cy="19" r="1.6" fill="var(--money)" />
        <circle cx="21" cy="17" r="1.6" fill="var(--paper)" opacity="0.7" />
      </svg>
    </span>
  )
}

function fmtMoney(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '$0'
  return `$${Math.round(n).toLocaleString()}`
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function Dashboard() {
  const { loading: authLoading, user } = useRequireAuth()
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/auth/sessions')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { if (!cancelled) setSessions(data?.sessions ?? []) })
      .catch(() => { if (!cancelled) setError('Could not load your reports.') })
    return () => { cancelled = true }
  }, [user])

  if (authLoading || !user) return null

  const totalLow = (sessions ?? []).reduce((s, x) => s + (x.total_estimated_low || 0), 0)
  const totalHigh = (sessions ?? []).reduce((s, x) => s + (x.total_estimated_high || 0), 0)

  return (
    <main id="main" className="strata-page dashboard-page">
      <nav className="auth-nav" aria-label="Primary">
        <Link to="/" className="logo">
          <LogoMark />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>CreditBowl</span>
        </Link>
        <AuthChip />
      </nav>

      <motion.section
        className="dashboard-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="dashboard-head">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Your bowl
          </span>
          <h1 className="dashboard-title">
            Welcome back, <em>{user.name || user.email.split('@')[0]}</em>.
          </h1>
          <p className="dashboard-sub">
            Every report you&apos;ve generated, in one private bowl. Raw tax returns
            never reach our servers — only the redacted derivatives stay here.
          </p>
        </header>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat-num num">{sessions?.length ?? '—'}</span>
            <span className="dashboard-stat-label">Reports generated</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-num num">
              {sessions ? `${fmtMoney(totalLow)}–${fmtMoney(totalHigh)}` : '—'}
            </span>
            <span className="dashboard-stat-label">Estimated credit range</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-num num"><em>0</em></span>
            <span className="dashboard-stat-label">SSNs we&apos;ve stored</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/upload" className="btn-primary">
            New report from PDF
            <span className="auth-submit-arrow" aria-hidden="true">→</span>
          </Link>
          <Link to="/quiz" className="btn-ghost">Answer 5 questions instead</Link>
        </div>

        <section className="dashboard-list" aria-label="My reports">
          <h2 className="dashboard-list-head">My reports</h2>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {!error && sessions === null && (
            <div className="dashboard-empty">Loading your reports…</div>
          )}

          {!error && sessions && sessions.length === 0 && (
            <div className="dashboard-empty">
              <p>No reports yet.</p>
              <p className="dashboard-empty-sub">
                Upload a tax return or take the 5-question quiz — your reports
                will land here.
              </p>
            </div>
          )}

          {!error && sessions && sessions.length > 0 && (
            <ul className="dashboard-cards">
              {sessions.map((s) => (
                <li key={s.id} className="dashboard-card">
                  <div className="dashboard-card-top">
                    <div>
                      <p className="dashboard-card-summary">
                        {s.business_summary || 'Business report'}
                      </p>
                      <p className="dashboard-card-meta">
                        {fmtDate(s.created_at)}
                        {s.state && <> · <span>{s.state}</span></>}
                        {s.employee_count != null && <> · <span>{s.employee_count} employees</span></>}
                      </p>
                    </div>
                    <span className={`dashboard-card-pill ${s.paid ? 'is-paid' : 'is-locked'}`}>
                      {s.paid ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <div className="dashboard-card-bottom">
                    <div>
                      <span className="dashboard-card-label">Estimated</span>
                      <span className="dashboard-card-money num">
                        {fmtMoney(s.total_estimated_low)}–{fmtMoney(s.total_estimated_high)}
                      </span>
                    </div>
                    <div className="dashboard-card-credits">
                      <span className="dashboard-card-label">Credits</span>
                      <span className="num">{s.credits_found}</span>
                    </div>
                    <Link to={`/results/${s.id}`} className="dashboard-card-link">
                      View report →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </motion.section>
    </main>
  )
}

export default Dashboard
