import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../strata.css'
// AUTH DISABLED — quiz runs without sign-in. Re-enable by un-commenting:
// import AuthChip from '../components/AuthChip.jsx'
// import { useRequireAuth } from '../lib/auth.js'

const defaultAnswers = {
  businessDescription: '',
  state: '',
  city: '',
  employeeCount: '',
  revenueBand: '500k_2m',
  activities: [],
  freeText: '',
  email: '',
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

const REVENUE_BANDS = [
  { value: 'under_500k', label: 'Under $500K' },
  { value: '500k_2m', label: '$500K – $2M' },
  { value: '2m_10m', label: '$2M – $10M' },
  { value: '10m_50m', label: '$10M – $50M' },
  { value: 'over_50m', label: 'Over $50M' },
]

const ACTIVITIES = [
  { key: 'hired_recently', title: 'Hired in last 12 months' },
  { key: 'bought_equipment', title: 'Bought equipment > $5K' },
  { key: 'built_software', title: 'Built or improved software' },
  { key: 'renewable_energy', title: 'Solar / EV / efficient HVAC' },
  { key: 'employee_health', title: 'Paid employee health insurance' },
  { key: 'paid_leave', title: 'Paid family or medical leave' },
  { key: 'hired_disadvantaged', title: 'Hired veterans or targeted workers' },
  { key: 'in_oz', title: 'Located in opportunity zone' },
  { key: 'started_retirement', title: 'Started 401(k) or SEP plan' },
]

function LogoMark() {
  return (
    <span
      className="logo-mark"
      style={{ display: 'grid', placeItems: 'center', width: 32, height: 32 }}
    >
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <ellipse cx="16" cy="11" rx="12" ry="2.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path
          d="M 4 11 Q 4 26 16 26 Q 28 26 28 11"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="11" cy="17" r="1.6" fill="var(--accent)" />
        <circle cx="16" cy="19" r="1.6" fill="var(--money)" />
        <circle cx="21" cy="17" r="1.6" fill="var(--paper)" opacity="0.7" />
      </svg>
    </span>
  )
}

function calcDiff() {
  const diff = Date.parse('2026-07-04T23:59:59-04:00') - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  }
}

function DeadlineStrip() {
  const [cd, setCd] = useState(calcDiff)
  useEffect(() => {
    const id = setInterval(() => setCd(calcDiff()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!cd) return null
  const pct = Math.min(1, cd.days / 365)
  const r = 9
  const c = 2 * Math.PI * r
  return (
    <div className="deadline">
      <div className="deadline-row">
        <span className="deadline-pulse" />
        <span className="deadline-text">
          <b>{cd.days} days</b> until July 4, 2026 — last day to retroactively claim R&amp;D credits for TY 2022–2024.
        </span>
        <span className="deadline-clock">
          <span className="clock-ring">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r={r} fill="none" stroke="var(--line-2)" strokeWidth="2" />
              <circle
                cx="12"
                cy="12"
                r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray={`${c * pct} ${c}`}
                strokeDashoffset={c * 0.25}
                transform="rotate(-90 12 12)"
                strokeLinecap="round"
              />
            </svg>
            <span>
              <span className="big">{cd.days}</span> days left
            </span>
          </span>
        </span>
      </div>
    </div>
  )
}

function QuizNav({ completion }) {
  return (
    <div className="nav">
      <div className="wrap nav-row">
        <Link to="/" className="logo">
          <LogoMark />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>CreditBowl</span>
        </Link>
        <div className="nav-right upload-nav-right">
          <span className="quiz-progress">{completion}% complete</span>
          {/* <AuthChip /> */}
        </div>
      </div>
    </div>
  )
}

function Step({ n, label, children }) {
  return (
    <div className="quiz-step">
      <div className="quiz-step-head">
        <span className="step-num">{n}</span>
        <span className="step-label">{label}</span>
      </div>
      {children}
    </div>
  )
}

function Quiz() {
  const navigate = useNavigate()
  // AUTH DISABLED — quiz runs without sign-in.
  // const { loading, user } = useRequireAuth()
  const [answers, setAnswers] = useState(defaultAnswers)

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  const completion = useMemo(() => {
    const required = ['businessDescription', 'state', 'employeeCount', 'email']
    const completed = required.filter((f) => String(answers[f]).trim())
    return Math.round((completed.length / required.length) * 100)
  }, [answers])

  // if (loading || !user) return null

  const update = (field, value) => setAnswers((a) => ({ ...a, [field]: value }))
  const toggle = (key) =>
    setAnswers((a) => ({
      ...a,
      activities: a.activities.includes(key)
        ? a.activities.filter((x) => x !== key)
        : [...a.activities, key],
    }))

  const submit = (e) => {
    e.preventDefault()
    const normalized = { ...answers, employeeCount: Number(answers.employeeCount || 0) }
    sessionStorage.setItem('taxCreditAnswers', JSON.stringify(normalized))
    navigate('/loading')
  }

  return (
    <div id="main" className="strata-page quiz-strata">
      <DeadlineStrip />
      <QuizNav completion={completion} />

      <section className="hero quiz-hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="drift" />
          <div className="glow g1" />
          <div className="glow g2" />
        </div>
        <div className="wrap">
          <header className="quiz-head">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Intake · 6 questions
            </span>
            <h1 className="hero-title">
              Tell us about<br />
              <em>your business.</em>
            </h1>
            <p className="hero-sub">
              Six short questions. About three minutes. We&apos;ll match you
              against 347 federal, state, and local credits.
            </p>
            <div className="quiz-meter" aria-hidden="true">
              <span style={{ width: `${completion}%` }} />
            </div>
          </header>
        </div>
      </section>

      <motion.section
        className="quiz-shell-wrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <form className="quiz-stack" onSubmit={submit}>
          <Step n="01" label="What does your business do?">
            <textarea
              required minLength={5} maxLength={500} rows={3}
              placeholder="e.g., 12-person digital marketing agency in Austin building websites and running paid ads."
              value={answers.businessDescription}
              onChange={(e) => update('businessDescription', e.target.value)}
            />
          </Step>

          <Step n="02" label="Where are you located?">
            <div className="row-2">
              <select required value={answers.state} onChange={(e) => update('state', e.target.value)}>
                <option value="">State</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="text" value={answers.city} onChange={(e) => update('city', e.target.value)} placeholder="City (optional)" />
            </div>
          </Step>

          <Step n="03" label="Size of the business?">
            <div className="row-2">
              <input
                required type="number" min={0} placeholder="Employees"
                value={answers.employeeCount}
                onChange={(e) => update('employeeCount', e.target.value)}
              />
              <select value={answers.revenueBand} onChange={(e) => update('revenueBand', e.target.value)}>
                {REVENUE_BANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </Step>

          <Step n="04" label="In the last 12 months, did you…">
            <div className="chip-grid">
              {ACTIVITIES.map((a) => {
                const checked = answers.activities.includes(a.key)
                return (
                  <button
                    type="button" key={a.key}
                    className={`chip ${checked ? 'chip-on' : ''}`}
                    onClick={() => toggle(a.key)}
                  >
                    <span className="chip-tick">{checked ? '✓' : ''}</span>
                    {a.title}
                  </button>
                )
              })}
            </div>
          </Step>

          <Step n="05" label="Anything else? (optional)">
            <textarea
              maxLength={500} rows={2}
              placeholder="e.g., we operate on tribal land, our facility had fire damage, we hired 2 vets…"
              value={answers.freeText}
              onChange={(e) => update('freeText', e.target.value)}
            />
          </Step>

          <Step n="06" label="Where should we send the report?">
            <input
              required type="email"
              placeholder="you@yourbusiness.com"
              value={answers.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Step>

          <div className="quiz-actions">
            <Link to="/" className="button secondary">← Back</Link>
            <button type="submit" className="button primary large">Run agents →</button>
          </div>
        </form>
      </motion.section>
    </div>
  )
}

export default Quiz
