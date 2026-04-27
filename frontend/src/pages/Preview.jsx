import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function getStoredAnswers() {
  try {
    return JSON.parse(sessionStorage.getItem('taxCreditAnswers'))
  } catch {
    return null
  }
}

function LogoMark({ size = 32 }) {
  return (
    <img
      className="mascot-img"
      src="/assets/creditbowl-logo.svg"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  )
}

function Preview() {
  const data = getStoredReport()
  const answers = getStoredAnswers()
  const [email, setEmail] = useState(answers?.email ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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

  const sendReport = async () => {
    if (submitting) return
    setError(null)
    const trimmedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email so we know where to send it.')
      return
    }
    setSubmitting(true)
    try {
      const upsert = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: data.session_id,
          email: trimmedEmail,
          report: data.report,
          profile: data.profile ?? null,
        }),
      })
      if (!upsert.ok) throw new Error('Could not save your session.')
      const { session_id: liveId } = await upsert.json()

      const pdf = await fetch(`/api/report/${encodeURIComponent(liveId)}/pdf`)
      if (!pdf.ok) throw new Error('Could not generate the PDF.')
      const blob = await pdf.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `creditbowl-report-${liveId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setSubmitting(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not download the report. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <main id="main" className="strata-results">
      <nav className="r-nav">
        <Link to="/" className="logo">
          <LogoMark />
          <span>CreditBowl</span>
        </Link>
        <Link to="/upload" className="nav-cta">Find my credits — $10</Link>
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
              <div className="r-preview-amount r-preview-amount-blurred" aria-label="Amount hidden until unlock">
                <span className="blurred-text">$X,XXX</span>
                <span className="lock-hint">unlock to see</span>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <section className="r-paywall">
          <div>
            <span className="r-paywall-eyebrow">Send the full report to your inbox</span>
            <h2><em>$99</em> · one-time</h2>
            <ul>
              <li>Per-credit dollar estimates with reasoning</li>
              <li>IRS form numbers + filing deadlines</li>
              <li>Week-by-week action plan</li>
              <li>Single-page CPA handoff sheet</li>
              <li>Emailed as a PDF the moment payment clears</li>
            </ul>
          </div>
          <div className="r-paywall-cta">
            <ul className="r-paywall-trust">
              <li>Stripe checkout · 256-bit SSL</li>
            </ul>
            <label className="r-paywall-email">
              <span>Email for the PDF</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </label>
            {error && <p className="r-paywall-error">{error}</p>}
            <button
              type="button"
              className="btn-primary"
              onClick={sendReport}
              disabled={submitting}
            >
              {submitting ? 'Generating PDF…' : 'Send me the report →'}
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
