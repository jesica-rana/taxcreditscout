import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from '../components/CountUp.jsx'
import { getSessionData } from '../lib/api.js'

function getStoredReport() {
  try {
    return JSON.parse(sessionStorage.getItem('taxCreditReport'))
  } catch {
    return null
  }
}

function Section({ title, items, tone }) {
  if (!items?.length) return null
  return (
    <section className={`results-block ${tone === 'warning' ? 'results-block-warn' : ''}`}>
      <header className="results-block-head">
        <h2 className="block-title">{title}</h2>
        <span className="block-count mono">{items.length}</span>
      </header>
      <motion.div
        className="credit-list"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
        }}
      >
        {items.map((s) => (
          <motion.article
            key={s.credit_id}
            className="credit-row"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
            }}
            whileHover={{ y: -1 }}
          >
            <div className="credit-row-head">
              <h3>{s.name}</h3>
              <span className="credit-row-amount mono">
                ${Number(s.estimated_low).toLocaleString()} – ${Number(s.estimated_high).toLocaleString()}
              </span>
            </div>
            <p className="credit-row-why">{s.why_you_qualify}</p>
            {s.action_steps?.length > 0 && (
              <ul className="credit-row-steps">
                {s.action_steps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            )}
            <p className="credit-row-meta">
              {s.jurisdiction} · {s.form} · {s.deadline}
              {s.source_url && (
                <>
                  {' · '}
                  <a href={s.source_url} target="_blank" rel="noreferrer">source</a>
                </>
              )}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

function Plan({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="plan-col">
      <h4 className="eyebrow">{title}</h4>
      <ul>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  )
}

function Results() {
  const { id } = useParams()
  const [data, setData] = useState(() => (id ? null : getStoredReport()))
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getSessionData(id).then((s) => {
      if (cancelled) return
      if (s?.report) {
        setData({ report: s.report, profile: s.profile, mode: 'live', session_id: s.id })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <main id="main" className="page fluz-style results-editorial">
        <section className="empty-state">
          <p className="eyebrow">Loading…</p>
          <h2 className="section-headline">Fetching your report.</h2>
        </section>
      </main>
    )
  }

  if (!data?.report) {
    return (
      <main id="main" className="page fluz-style results-editorial">
        <section className="empty-state">
          <p className="eyebrow">No report</p>
          <h2 className="section-headline">Take the intake first.</h2>
          <Link className="button primary large" to="/quiz">Take the quiz →</Link>
        </section>
      </main>
    )
  }

  const { report } = data
  const sectionsTotal =
    report.critical_deadlines.length +
    report.federal.length +
    report.state.length +
    report.local.length

  return (
    <main id="main" className="page fluz-style results-editorial">
      <nav className="hero-nav" aria-label="Primary">
        <Link to="/" className="brand-mark">Tax Credit Finder</Link>
        <div className="nav-links">
          <Link to="/quiz" className="text-link">Retake quiz</Link>
          <a href="#cpa" className="button primary compact">CPA handoff</a>
        </div>
      </nav>

      <motion.section
        className="results-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="results-mode-row">
          <p className="eyebrow">Opportunity report</p>
          {data.mode && (
            <span className={`mode-badge mode-${data.mode}`}>
              {data.mode === 'live' && 'Live agents'}
              {data.mode === 'hybrid' && 'Live totals · synthesized detail'}
              {data.mode === 'local' && 'Offline preview'}
            </span>
          )}
        </div>
        <h1 className="results-total serif-display">
          <CountUp to={report.total_estimated_low} duration={1100} />
          <span className="range-sep"> – </span>
          <CountUp to={report.total_estimated_high} duration={1300} />
        </h1>
        <p className="results-summary">{report.business_summary}</p>

        <div className="results-meta">
          <div>
            <strong className="mono">{sectionsTotal}</strong>
            <span>credits matched</span>
          </div>
          <div>
            <strong className="mono">{report.critical_deadlines.length}</strong>
            <span>deadline-sensitive</span>
          </div>
          <div>
            <strong className="mono">{report.federal.length}</strong>
            <span>federal</span>
          </div>
          <div>
            <strong className="mono">{report.state.length + report.local.length}</strong>
            <span>state &amp; local</span>
          </div>
        </div>

        {report.disclaimer && <p className="results-disclaimer">{report.disclaimer}</p>}
      </motion.section>

      <div className="results-content">
        <Section title="⚠ Critical deadlines" tone="warning" items={report.critical_deadlines} />
        <Section title="Federal" items={report.federal} />
        <Section title="State" items={report.state} />
        <Section title="Local" items={report.local} />

        <section className="results-block">
          <header className="results-block-head">
            <h2 className="block-title">Action plan</h2>
          </header>
          <div className="plan-grid">
            <Plan title="This week" items={report.action_plan_this_week} />
            <Plan title="This month" items={report.action_plan_this_month} />
            <Plan title="This quarter" items={report.action_plan_this_quarter} />
          </div>
        </section>

        <section id="cpa" className="results-block cpa-block">
          <header className="results-block-head">
            <h2 className="block-title">CPA handoff</h2>
            <button
              type="button"
              className="button secondary compact"
              onClick={() => navigator.clipboard?.writeText(report.cpa_handoff_summary)}
            >
              Copy text
            </button>
          </header>
          <p className="cpa-text">{report.cpa_handoff_summary}</p>
        </section>
      </div>

      <footer className="landing-footer">
        <p>Informational research, not tax advice. Verify with a qualified CPA before filing.</p>
      </footer>
    </main>
  )
}

export default Results
