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

// Strip protocol + www. — leaves "irs.gov/forms-pubs/about-form-5884"
function shortUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

function confidencePercent(value) {
  const n = Math.round((Number(value) || 0) * 100)
  return Math.min(99, Math.max(0, n))
}

const QUAL_LABEL = {
  yes: 'Qualifies',
  likely: 'Likely qualifies',
  no: 'Does not qualify',
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

function CreditCard({ s }) {
  const status = s.qualification_status || 'likely'
  const pct = confidencePercent(s.qualification_confidence)
  return (
    <motion.article
      className="r-credit"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      <header className="r-credit-head">
        <div className="r-credit-titlewrap">
          <h3 className="r-credit-name">{s.name}</h3>
          <div className="r-credit-tagrow">
            {s.irc_section && (
              <span className="r-credit-tag">IRC §{s.irc_section}</span>
            )}
            {(s.qualification_confidence != null) && (
              <span className={`r-credit-confidence r-credit-confidence-${status}`}>
                {QUAL_LABEL[status] || 'Likely qualifies'} · {pct}% confidence
              </span>
            )}
          </div>
        </div>
        <span className="r-credit-amount">
          ${Number(s.estimated_low).toLocaleString()} – ${Number(s.estimated_high).toLocaleString()}
        </span>
      </header>

      {s.how_it_works && (
        <div className="r-credit-block">
          <p className="r-credit-label">How this credit works</p>
          <p className="r-credit-text">{s.how_it_works}</p>
        </div>
      )}

      <div className="r-credit-block">
        <p className="r-credit-label">Why you qualify</p>
        <p className="r-credit-text">{s.why_you_qualify}</p>
      </div>

      {s.how_we_estimated && (
        <div className="r-credit-block">
          <p className="r-credit-label">How we estimated this</p>
          <p className="r-credit-text">{s.how_we_estimated}</p>
        </div>
      )}

      {s.eligibility_criteria?.length > 0 && (
        <div className="r-credit-block">
          <p className="r-credit-label">Eligibility criteria</p>
          <ul className="r-credit-steps">
            {s.eligibility_criteria.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}

      {s.action_steps?.length > 0 && (
        <div className="r-credit-block">
          <p className="r-credit-label">Action steps</p>
          <ul className="r-credit-steps">
            {s.action_steps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}

      {s.what_to_verify?.length > 0 && (
        <div className="r-credit-verify">
          <p className="r-credit-label r-credit-label-warn">Confirm with your CPA</p>
          <ul className="r-credit-verify-list">
            {s.what_to_verify.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}

      {s.common_pitfalls?.length > 0 && (
        <div className="r-credit-pitfalls">
          <p className="r-credit-label r-credit-label-pitfall">Common pitfalls</p>
          <ul className="r-credit-pitfalls-list">
            {s.common_pitfalls.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {(s.cashflow_treatment || s.stacks_with?.length > 0 || s.typical_industry_finding) && (
        <div className="r-credit-facts">
          {s.cashflow_treatment && (
            <div className="r-credit-fact">
              <span className="r-credit-fact-label">Cashflow treatment</span>
              <span className="r-credit-fact-value">{s.cashflow_treatment}</span>
            </div>
          )}
          {s.stacks_with?.length > 0 && (
            <div className="r-credit-fact">
              <span className="r-credit-fact-label">Stacks with</span>
              <span className="r-credit-fact-value">{s.stacks_with.join(' · ')}</span>
            </div>
          )}
          {s.typical_industry_finding && (
            <div className="r-credit-fact">
              <span className="r-credit-fact-label">Typical industry finding</span>
              <span className="r-credit-fact-value">{s.typical_industry_finding}</span>
            </div>
          )}
        </div>
      )}

      {s.documentation?.length > 0 && (
        <details className="r-credit-docs">
          <summary>Documentation required ({s.documentation.length})</summary>
          <ul>
            {s.documentation.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </details>
      )}

      <footer className="r-credit-foot">
        <p className="r-credit-meta">
          <span>{s.jurisdiction}</span>
          <span className="dot">·</span>
          <span>{s.form}</span>
          <span className="dot">·</span>
          <span>{s.deadline}</span>
          {s.source_authority && (
            <>
              <span className="dot">·</span>
              <span>{s.source_authority}</span>
            </>
          )}
        </p>
        {s.source_url && (
          <a
            href={s.source_url}
            target="_blank"
            rel="noreferrer"
            className="r-credit-source"
          >
            {shortUrl(s.source_url)} ↗
          </a>
        )}
      </footer>
    </motion.article>
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
        {items.map((s) => <CreditCard key={s.credit_id} s={s} />)}
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
  const [copied, setCopied] = useState(false)

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

  function copyHandoff() {
    if (!data?.report?.cpa_handoff_summary) return
    navigator.clipboard?.writeText(data.report.cpa_handoff_summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          <Section title="⚠ Critical deadlines" tone="warning" items={report.critical_deadlines} />
          <Section title="Federal credits" items={report.federal} />
          <Section title="State credits" items={report.state} />
          <Section title="Local credits" items={report.local} />

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
                className="r-copy-btn"
                onClick={copyHandoff}
              >
                {copied ? '✓ Copied' : 'Copy text'}
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
