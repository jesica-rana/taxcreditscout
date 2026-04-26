import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../strata.css'

const FEATURES = [
  {
    n: '01',
    title: 'I read your tax return.',
    body: 'Drop your PDF. I parse it locally — names, SSN, EIN, addresses redacted in your browser before anything leaves your device.',
    visual: 'redactor',
  },
  {
    n: '02',
    title: 'I check 347 credits.',
    body: 'Federal R&D, WOTC, Section 179, state R&D bonuses, opportunity zones — every credit I know about, scanned in 30 seconds.',
    visual: 'bowl',
  },
  {
    n: '03',
    title: 'I show you the money.',
    body: 'Average finding: $14,200. Money back if I find less than $1,000. Audit costs $10.',
    visual: 'estimate',
  },
  {
    n: '04',
    title: 'You take it to your CPA.',
    body: '12-page report with form numbers and a one-page handoff sheet. Your accountant files. I just find what they missed.',
    visual: 'report',
  },
]

function FeatureVisual({ kind }) {
  if (kind === 'redactor') {
    return (
      <div className="feat-card">
        <div className="feat-bar mono"><span className="feat-dot" /> 1040.pdf · local-only</div>
        <div className="feat-rows mono">
          <div><span>Name</span><span className="feat-redact">[ PERSON ]</span></div>
          <div><span>SSN</span><span className="feat-redact">[ SSN ]</span></div>
          <div><span>EIN</span><span className="feat-redact">[ EIN ]</span></div>
          <div><span>R&amp;D wages</span><span className="feat-keep">$184,200</span></div>
          <div><span>Equipment</span><span className="feat-keep">$42,800</span></div>
        </div>
      </div>
    )
  }
  if (kind === 'bowl') {
    return (
      <div className="feat-card feat-bowl">
        <svg viewBox="0 0 320 180" fill="none">
          <ellipse cx="160" cy="60" rx="130" ry="14" stroke="var(--accent)" strokeWidth="2.5"/>
          <path d="M 30 60 Q 30 165 160 165 Q 290 165 290 60" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span className="feat-tile a">R&amp;D · $20,160</span>
        <span className="feat-tile b">WOTC · $3,120</span>
        <span className="feat-tile c">§179 · $8,400</span>
      </div>
    )
  }
  if (kind === 'estimate') {
    return (
      <div className="feat-card">
        <p className="feat-eyebrow mono">Live estimate</p>
        <p className="feat-num mono">$14,200</p>
        <p className="feat-lbl">avg per business</p>
        <ul className="feat-list">
          <li><span>Federal R&amp;D</span><b className="mono">$8,400</b></li>
          <li><span>WOTC</span><b className="mono">$3,120</b></li>
          <li><span>Section 179</span><b className="mono">$2,680</b></li>
        </ul>
      </div>
    )
  }
  if (kind === 'report') {
    return (
      <div className="feat-card">
        <p className="feat-eyebrow mono">Tax credit audit · 12 pages</p>
        <h3 className="feat-h3">$14,200 in credits</h3>
        <ul className="feat-forms mono">
          <li>▸ Form 6765 · Federal R&amp;D Credit</li>
          <li>▸ Form 5884 · WOTC</li>
          <li>▸ Form 4562 · §179 Equipment</li>
        </ul>
        <p className="feat-handoff mono">→ Email this to your CPA</p>
      </div>
    )
  }
  return null
}

function Walkthrough() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  function submit(e) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    try {
      const list = JSON.parse(localStorage.getItem('cb-waitlist') || '[]')
      list.push({ email, at: new Date().toISOString() })
      localStorage.setItem('cb-waitlist', JSON.stringify(list))
    } catch {}
    setSubmitted(true)
  }

  return (
    <div id="main" className="strata-page wt-page">
      <header className="wt-top">
        <Link to="/" className="walk-brand">
          <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="" width="32" height="32" />
          <span>CreditBowl</span>
        </Link>
        <Link to="/" className="walk-skip">Skip →</Link>
      </header>

      <div className="wt-grid">
        {/* LEFT — sticky mascot */}
        <aside className="wt-mascot-col">
          <div className="wt-mascot-stage">
            <img className="mascot-img wt-mascot-img" src="/assets/creditbowl-logo.svg" alt="CreditBowl mascot" />
          </div>
        </aside>

        {/* RIGHT — features scroll past */}
        <section className="wt-feats">
          <header className="wt-intro">
            <p className="kicker mono">Coming soon</p>
            <h1 className="wt-h1">
              Be first<br/>in <em>the bowl.</em>
            </h1>
            <p className="wt-sub">
              CreditBowl finds every federal, state, and local tax credit your business qualifies for — without ever seeing your SSN. Drop your email to claim your slot.
            </p>

            {!submitted ? (
              <form className="walk-form wt-intro-form" onSubmit={submit}>
                <input
                  type="email"
                  required
                  placeholder="you@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button type="submit">Join waitlist →</button>
              </form>
            ) : (
              <div className="walk-thanks wt-intro-thanks">
                <p className="thanks-h">You&apos;re in. ✓</p>
                <p className="thanks-b">We&apos;ll email <b className="mono">{email}</b> when your slot opens.</p>
              </div>
            )}
            <p className="waitlist-fineprint mono wt-intro-fp">
              No spam · we email once · scroll to see what CreditBowl does ↓
            </p>
          </header>

          {FEATURES.map((f, i) => (
            <motion.article
              key={i}
              className="wt-feat"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="wt-feat-num mono">{f.n}</span>
              <h2 className="wt-feat-title">{f.title}</h2>
              <p className="wt-feat-body">{f.body}</p>
              <FeatureVisual kind={f.visual} />
            </motion.article>
          ))}

          {/* Final reminder — short reprise */}
          <motion.article
            className="wt-feat wt-final"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="wt-feat-title">Still here? <em>Save your slot.</em></h2>
            {!submitted ? (
              <form className="walk-form" onSubmit={submit}>
                <input
                  type="email"
                  required
                  placeholder="you@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button type="submit">Join waitlist →</button>
              </form>
            ) : (
              <div className="walk-thanks">
                <p className="thanks-h">You&apos;re in. ✓</p>
                <p className="thanks-b">We&apos;ll email <b className="mono">{email}</b>.</p>
              </div>
            )}
          </motion.article>
        </section>
      </div>
    </div>
  )
}

export default Walkthrough
