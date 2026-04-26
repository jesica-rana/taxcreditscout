import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from '../components/CountUp.jsx'
import DeadlineBanner from '../components/DeadlineBanner.jsx'
import TrustBlock from '../components/TrustBlock.jsx'

function getStoredReport() {
  try {
    return JSON.parse(sessionStorage.getItem('taxCreditReport'))
  } catch {
    return null
  }
}

function Preview() {
  const navigate = useNavigate()
  const data = getStoredReport()

  if (!data?.report) {
    return (
      <main id="main" className="page fluz-style results-editorial">
        <DeadlineBanner />
        <section className="empty-state">
          <p className="eyebrow">No report</p>
          <h2 className="section-headline">Take the intake first.</h2>
          <Link className="button primary large" to="/quiz">Take the quiz →</Link>
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
    // Free unlock for now; wire Stripe Checkout here when keys are live.
    sessionStorage.setItem('taxCreditUnlocked', '1')
    navigate('/results')
  }

  return (
    <main id="main" className="page fluz-style preview-page">
      <DeadlineBanner />
      <nav className="hero-nav" aria-label="Primary">
        <Link to="/" className="brand-mark">Tax Credit Finder</Link>
        <Link to="/quiz" className="text-link">Retake quiz</Link>
      </nav>

      <motion.section
        className="results-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="eyebrow">Preview · {allSections.length} credits found</p>
        <h1 className="results-total serif-display">
          <CountUp to={report.total_estimated_low} duration={1100} />
          <span className="range-sep"> – </span>
          <CountUp to={report.total_estimated_high} duration={1300} />
        </h1>
        <p className="results-summary">{report.business_summary}</p>
      </motion.section>

      {report.critical_deadlines.length > 0 && (
        <div className="critical-strip">
          ⚠ {report.critical_deadlines.length} of these have hard deadlines —
          including the July 4, 2026 retroactive R&amp;D election.
        </div>
      )}

      <motion.ul
        className="preview-credit-list"
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
            className="preview-credit-row"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <div className="preview-credit-info">
              <h3>{s.name}</h3>
              <p>
                {s.jurisdiction}
                {s.deadline_critical && (
                  <span className="deadline-pill"> · Deadline-critical</span>
                )}
              </p>
            </div>
            <div className="preview-credit-locked">
              <span className="blur-amount mono">$X,XXX</span>
              <span className="lock-hint">unlock to see</span>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <section className="paywall-card">
        <div>
          <p className="eyebrow">Unlock the full report</p>
          <h2>$99 · one-time</h2>
          <ul>
            <li>Per-credit dollar estimates with reasoning</li>
            <li>IRS form numbers + filing deadlines</li>
            <li>Week-by-week action plan</li>
            <li>Single-page CPA handoff sheet</li>
            <li>12-page PDF · emailed instantly</li>
          </ul>
        </div>
        <div className="paywall-cta">
          <TrustBlock />
          <button type="button" className="button primary large" onClick={unlock}>
            Unlock full report — $99 →
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Informational research, not tax advice. Verify with a qualified CPA before filing.</p>
      </footer>
    </main>
  )
}

export default Preview
