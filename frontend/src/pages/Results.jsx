import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from '../components/CountUp.jsx'
import { getSessionData } from '../lib/api.js'
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

function Section({ title, items, tone }) {
  if (!items?.length) return null
  return (
    <section className={`r-block ${tone === 'warning' ? 'r-block-warn' : ''}`}>
      <header className="r-block-head">
        <h2 className="r-block-title">{title}</h2>
        <span className="r-block-count">{items.length} {items.length === 1 ? 'credit' : 'credits'}</span>
      </header>
      <motion.div
        className="r-list"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
        }}
      >
        {items.map((s) => (
          <motion.article
            key={s.credit_id}
            className="r-credit"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <div className="r-credit-head">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <h3 className="r-credit-name">{s.name}</h3>
                {s.irc_section && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em',
                    padding: '3px 8px', border: '1px solid var(--line-2)', borderRadius: 4,
                    color: 'var(--ink-2)', textTransform: 'uppercase',
                  }}>
                    IRC §{s.irc_section}
                  </span>
                )}
              </div>
              <span className="r-credit-amount">
                ${Number(s.estimated_low).toLocaleString()} – ${Number(s.estimated_high).toLocaleString()}
              </span>
            </div>

            {s.how_it_works && (
              <p style={{
                margin: '12px 0 0', padding: '10px 14px', borderLeft: '2px solid var(--line-2)',
                color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55,
              }}>
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>How this credit works: </strong>
                {s.how_it_works}
              </p>
            )}

            <p className="r-credit-why" style={{ marginTop: 12 }}>
              <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Why you qualify: </strong>
              {s.why_you_qualify}
            </p>

            {s.action_steps?.length > 0 && (
              <ul className="r-credit-steps">
                {s.action_steps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            )}

            {s.what_to_verify?.length > 0 && (
              <div style={{
                marginTop: 12, padding: '10px 14px', background: 'rgba(255, 200, 100, 0.06)',
                border: '1px solid rgba(255, 200, 100, 0.2)', borderRadius: 6,
              }}>
                <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                  textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 6 }}>
                  Confirm with your CPA
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink-2)' }}>
                  {s.what_to_verify.map((step, i) => <li key={i} style={{ marginBottom: 2 }}>{step}</li>)}
                </ul>
              </div>
            )}

            {s.documentation?.length > 0 && (
              <details style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)' }}>
                <summary style={{ cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11,
                  letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Documentation required ({s.documentation.length})
                </summary>
                <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                  {s.documentation.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </details>
            )}

            <div style={{
              marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, flexWrap: 'wrap',
            }}>
              <p className="r-credit-meta" style={{ margin: 0 }}>
                {s.jurisdiction} · {s.form} · {s.deadline}
              </p>
              {s.source_url && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
                    textTransform: 'uppercase', padding: '6px 12px',
                    border: '1px solid var(--line-2)', borderRadius: 999,
                    color: 'var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  Read source ↗
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

function Plan({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="r-plan-col">
      <h4>{title}</h4>
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
    document.documentElement.dataset.theme = 'dark'
  }, [])

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
      <main id="main" className="strata-results">
        <nav className="r-nav">
          <Link to="/" className="logo"><LogoMark /><span>CreditBowl</span></Link>
        </nav>
        <section className="r-empty">
          <span className="eyebrow"><span className="eyebrow-dot" /> Loading</span>
          <h2>Fetching your report…</h2>
        </section>
      </main>
    )
  }

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
  const totalCredits =
    report.critical_deadlines.length +
    report.federal.length +
    report.state.length +
    report.local.length

  return (
    <main id="main" className="strata-results">
      <nav className="r-nav">
        <Link to="/" className="logo">
          <LogoMark />
          <span>CreditBowl</span>
        </Link>
        <div className="r-nav-links">
          <Link to="/quiz" className="r-nav-link">Retake quiz</Link>
          <a href="#cpa" className="r-nav-cta">CPA handoff</a>
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
              Opportunity report
            </span>
            {data.mode && (
              <span className="r-live-badge">
                {data.mode === 'live' && 'Live agents'}
                {data.mode === 'hybrid' && 'Live totals · synthesized detail'}
                {data.mode === 'local' && 'Offline preview'}
              </span>
            )}
          </div>
          <h1 className="r-total">
            <CountUp to={report.total_estimated_low} duration={1100} />
            <span className="range-sep">–</span>
            <CountUp to={report.total_estimated_high} duration={1300} />
          </h1>
          <p className="r-summary">{report.business_summary}</p>

          <div className="r-meta">
            <div className="r-meta-item">
              <strong>{totalCredits}</strong>
              <span>Credits matched</span>
            </div>
            <div className="r-meta-item">
              <strong>{report.critical_deadlines.length}</strong>
              <span>Deadline-sensitive</span>
            </div>
            <div className="r-meta-item">
              <strong>{report.federal.length}</strong>
              <span>Federal</span>
            </div>
            <div className="r-meta-item">
              <strong>{report.state.length + report.local.length}</strong>
              <span>State &amp; local</span>
            </div>
          </div>

          {report.disclaimer && <p className="r-disclaim">{report.disclaimer}</p>}
        </header>

        <div className="r-content">
          <Section title="Critical deadlines" tone="warning" items={report.critical_deadlines} />
          <Section title="Federal" items={report.federal} />
          <Section title="State" items={report.state} />
          <Section title="Local" items={report.local} />

          <section className="r-block">
            <header className="r-block-head">
              <h2 className="r-block-title">Action plan</h2>
            </header>
            <div className="r-plan-grid">
              <Plan title="This week" items={report.action_plan_this_week} />
              <Plan title="This month" items={report.action_plan_this_month} />
              <Plan title="This quarter" items={report.action_plan_this_quarter} />
            </div>
          </section>

          <section id="cpa" className="r-block">
            <header className="r-block-head">
              <h2 className="r-block-title">CPA handoff</h2>
              <button
                type="button"
                className="r-nav-link"
                style={{ background: 'transparent', border: '1px solid var(--line-2)', padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                onClick={() => navigator.clipboard?.writeText(report.cpa_handoff_summary)}
              >
                Copy text
              </button>
            </header>
            <p className="r-cpa-card">{report.cpa_handoff_summary}</p>
          </section>
        </div>
      </motion.section>

      <footer className="r-foot">
        Informational research, not tax advice. Verify with a qualified CPA before filing.
      </footer>
    </main>
  )
}

export default Results
