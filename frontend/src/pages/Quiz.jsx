import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DeadlineBanner from '../components/DeadlineBanner.jsx'

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

function Step({ n, label, children }) {
  return (
    <fieldset className="quiz-step">
      <legend>
        <span className="step-num mono">{n}</span>
        <span className="step-label">{label}</span>
      </legend>
      {children}
    </fieldset>
  )
}

function Quiz() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState(defaultAnswers)

  const completion = useMemo(() => {
    const required = ['businessDescription', 'state', 'employeeCount', 'email']
    const completed = required.filter((f) => String(answers[f]).trim())
    return Math.round((completed.length / required.length) * 100)
  }, [answers])

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
    <main id="main" className="page fluz-style quiz-editorial">
      <DeadlineBanner />
      <nav className="hero-nav" aria-label="Primary">
        <Link to="/" className="brand-mark">Tax Credit Finder</Link>
        <span className="quiz-progress mono">{completion}% complete</span>
      </nav>

      <motion.section
        className="quiz-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="quiz-header">
          <p className="eyebrow">Intake</p>
          <h1 className="section-headline">Tell us about<br />your business.</h1>
          <p className="section-sub">Six short questions. About three minutes. No login.</p>
          <div className="meter"><span style={{ width: `${completion}%` }} /></div>
        </header>

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
              <input value={answers.city} onChange={(e) => update('city', e.target.value)} placeholder="City (optional)" />
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
            <Link to="/" className="button secondary">Back</Link>
            <button type="submit" className="button primary large">Run agents →</button>
          </div>
        </form>
      </motion.section>
    </main>
  )
}

export default Quiz
