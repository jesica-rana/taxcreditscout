import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from '../components/CountUp.jsx'
import '../strata.css'

function getStoredReport() {
  try {
    return JSON.parse(sessionStorage.getItem('taxCreditReport'))
  } catch {
    return null
  }
}

function LogoMark() {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
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

function Preview() {
  const navigate = useNavigate()
  const data = getStoredReport()

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  if (!data?.report) {
    return (
      <main id="main" className="strata-results">
        <nav className="r-nav">
          <Link to="/" className="logo"><LogoMark /><span>CreditBowl</span></Link>
        </nav>
        <section className="r-empty">
          <span className="eyebrow">No report yet</span>
          <h2>Take the intake first.</h2>
          <Link className="btn-primary" to="/quiz">Take the quiz →</Link>
        </section>
      </main>
    )
  }

  const { report } = data
  const allSections = [
    ...report.critical_deadlines,
    ...report.federal,
    ...report.state,
    ...report.local,
  ]

  const unlock = () => {
    sessionStorage.setItem('taxCreditUnlocked', '1')
    navigate('/results')
  }

  return (
    <main id="main" className="strata-results">
      <nav className="r-nav">
        <Link to="/" className="logo">
          <LogoMark />
          <span>CreditBowl</span>
        </Link>
        <div className="r-nav-links">
          <Link to="/quiz" className="r-nav-link">Retake quiz</Link>
        </div>
      </nav>

      <motion.section
        className="r-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="r-hero">
          <div className="r-hero-row">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Preview · {allSections.length} credits found
            </span>
          </div>
          <h1 className="r-total">
            <CountUp to={report.total_estimated_low} duration={1100} />
            <span className="range-sep">–</span>
            <CountUp to={report.total_estimated_high} duration={1300} />
          </h1>
          <p className="r-summary">{report.business_summary}</p>
        </header>

        {report.critical_deadlines.length > 0 && (
          <div className="r-critical-strip">
            ⚠ {report.critical_deadlines.length} of these have hard deadlines —
            including the July 4, 2026 retroactive R&amp;D election.
          </div>
        )}

        <motion.ul
          className="r-preview-list"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
          }}
        >
          {allSections.map((s) => (
            <motion.li
              key={s.credit_id}
              className="r-preview-row"
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <div className="r-preview-info">
                <h3>{s.name}</h3>
                <p>
                  {s.jurisdiction}
                  {s.deadline_critical && (
                    <span className="r-deadline-pill"> · Deadline-critical</span>
                  )}
                </p>
              </div>
              <div className="r-preview-amount">
                {s.estimated_low === s.estimated_high
                  ? `$${s.estimated_low.toLocaleString()}`
                  : `$${s.estimated_low.toLocaleString()} – $${s.estimated_high.toLocaleString()}`}
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <section className="r-paywall">
          <div>
            <span className="r-paywall-eyebrow">Unlock the full report</span>
            <h2><em>$99</em> · one-time</h2>
            <ul>
              <li>Per-credit dollar estimates with reasoning</li>
              <li>IRS form numbers + filing deadlines</li>
              <li>Week-by-week action plan</li>
              <li>Single-page CPA handoff sheet</li>
              <li>12-page PDF · emailed instantly</li>
            </ul>
          </div>
          <div className="r-paywall-cta">
            <ul className="r-paywall-trust">
              <li>Money-back if we find less than $1,000</li>
              <li>7-day full refund · no questions asked</li>
              <li>Stripe checkout · 256-bit SSL</li>
            </ul>
            <button type="button" className="btn-primary" onClick={unlock}>
              Unlock full report — $99 →
            </button>
          </div>
        </section>
      </motion.section>

      <footer className="r-foot">
        Informational research, not tax advice. Verify with a qualified CPA before filing.
      </footer>
    </main>
  )
}

export default Preview
