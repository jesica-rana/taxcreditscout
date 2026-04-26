import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import '../strata.css'

const SECTIONS = [
  {
    eyebrow: 'Hi there',
    title: <>I&apos;m <em>CreditBowl.</em></>,
    body: 'I scan tax credits for small businesses. Federal, state, and local. Every single one. And I do it without ever seeing your SSN.',
    cta: 'Scroll to see what I do',
  },
  {
    eyebrow: 'Step 01 · Read',
    title: <>I read your return.<br/>In <em>your</em> browser.</>,
    body: 'Drop your tax PDF. I parse it locally. Names, SSN, EIN, addresses — I redact them right there on your laptop, before anything is sent.',
    visual: 'redactor',
  },
  {
    eyebrow: 'Step 02 · Search',
    title: <>I check <em>347</em> credits<br/>against your business.</>,
    body: 'Federal R&D. WOTC. Section 179. State R&D bonuses. City enterprise zones. I scan them all — in 30 seconds.',
    visual: 'bowl',
  },
  {
    eyebrow: 'Step 03 · Estimate',
    title: <>I show you<br/>the <em>money.</em></>,
    body: 'Average finding: $14,200. If I find less than $1,000, you pay nothing. Audit costs $10. Money back, no questions.',
    visual: 'estimator',
  },
  {
    eyebrow: 'Step 04 · Handoff',
    title: <>You take it<br/>to your <em>CPA.</em></>,
    body: 'I generate a 12-page report with IRS form numbers and a one-page CPA handoff sheet. Your accountant files. I just find the credits they missed.',
    visual: 'report',
  },
]

// Mini visual shown to the right of each section
function SectionVisual({ kind }) {
  if (kind === 'redactor') {
    return (
      <div className="walk-visual walk-redactor">
        <div className="walk-rdoc-bar"><span className="walk-dot" /> 1040.pdf</div>
        <div className="walk-rdoc-body">
          <div><span className="k">Name</span><span className="redact-fade">[ PERSON ]</span></div>
          <div><span className="k">SSN</span><span className="redact-fade">[ SSN ]</span></div>
          <div><span className="k">EIN</span><span className="redact-fade">[ EIN ]</span></div>
          <div><span className="k">R&amp;D wages</span><span className="walk-keep">$184,200</span></div>
          <div><span className="k">Equipment</span><span className="walk-keep">$42,800</span></div>
        </div>
      </div>
    )
  }
  if (kind === 'bowl') {
    return (
      <div className="walk-visual walk-bowl">
        <svg viewBox="0 0 400 280" fill="none">
          <ellipse cx="200" cy="90" rx="160" ry="18" stroke="var(--accent)" strokeWidth="2.5"/>
          <path d="M 40 90 Q 40 250 200 250 Q 360 250 360 90" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <div className="walk-tile t-a">R&amp;D · $20,160</div>
        <div className="walk-tile t-b">WOTC · $3,120</div>
        <div className="walk-tile t-c">Sec 179 · $8,400</div>
      </div>
    )
  }
  if (kind === 'estimator') {
    return (
      <div className="walk-visual walk-est">
        <p className="walk-est-eyebrow mono">Live estimate</p>
        <p className="walk-est-num mono">$14,200</p>
        <p className="walk-est-lbl">avg credits found per business</p>
        <ul className="walk-est-list">
          <li><span>Federal R&amp;D</span><b className="mono">$8,400</b></li>
          <li><span>WOTC</span><b className="mono">$3,120</b></li>
          <li><span>Section 179</span><b className="mono">$2,680</b></li>
        </ul>
      </div>
    )
  }
  if (kind === 'report') {
    return (
      <div className="walk-visual walk-report">
        <div className="walk-report-head">
          <p className="mono">Tax Credit Audit · 12 pages</p>
        </div>
        <h3>$14,200 in credits found</h3>
        <ul>
          <li>Form 6765 · Federal R&D Credit</li>
          <li>Form 5884 · WOTC</li>
          <li>Form 4562 · §179 Equipment</li>
        </ul>
        <p className="walk-report-foot">→ Email this to your CPA.</p>
      </div>
    )
  }
  return null
}

function Walkthrough() {
  const containerRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  // Force dark theme
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  const { scrollYProgress } = useScroll({ target: containerRef })
  // Smooth out the scroll position
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 })

  // Mascot horizontal position: 5vw → 88vw across the whole scroll
  const mascotX = useTransform(smoothProgress, [0, 1], ['5vw', '88vw'])
  // Slight rotation to suggest walking
  const mascotRot = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [-2, 2, -2, 2, 0])
  // Vertical bobbing
  const mascotY = useTransform(smoothProgress, [0, 0.5, 1], [0, -8, 0])

  function submit(e) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    // Persist locally for now — wire to backend later
    try {
      const list = JSON.parse(localStorage.getItem('cb-waitlist') || '[]')
      list.push({ email, at: new Date().toISOString() })
      localStorage.setItem('cb-waitlist', JSON.stringify(list))
    } catch {
      // ignore
    }
    setSubmitted(true)
  }

  return (
    <div id="main" className="strata-page walkthrough" ref={containerRef}>
      {/* Top brand */}
      <header className="walk-top">
        <Link to="/" className="walk-brand">
          <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="" width="32" height="32" />
          <span>CreditBowl</span>
        </Link>
        <Link to="/" className="walk-skip">Skip walkthrough →</Link>
      </header>

      {/* Walking mascot — fixed bottom, scroll-linked horizontal travel */}
      <motion.div
        className="walk-mascot"
        style={{ x: mascotX, y: mascotY, rotate: mascotRot }}
        aria-hidden="true"
      >
        <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="" />
      </motion.div>

      {/* Ground line beneath the mascot */}
      <div className="walk-ground" aria-hidden="true" />

      {/* Sections */}
      {SECTIONS.map((s, i) => (
        <section className="walk-scene" key={i}>
          <div className="walk-content">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="walk-eyebrow mono">{s.eyebrow}</p>
              <h2 className="walk-title">{s.title}</h2>
              <p className="walk-body">{s.body}</p>
              {s.cta && <p className="walk-cta">↓ {s.cta}</p>}
            </motion.div>
          </div>
          {s.visual && (
            <motion.div
              className="walk-visual-wrap"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <SectionVisual kind={s.visual} />
            </motion.div>
          )}
        </section>
      ))}

      {/* Final scene — waitlist */}
      <section className="walk-scene walk-final">
        <motion.div
          className="walk-final-card"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <img className="walk-final-mascot" src="/assets/creditbowl-logo.svg" alt="" width="120" height="120" />
          <p className="walk-eyebrow mono">Coming soon</p>
          <h2 className="walk-title">Be first<br/>to <em>fill the bowl.</em></h2>
          <p className="walk-body">
            We&apos;re onboarding our first 500 small businesses. Drop your email
            and we&apos;ll let you know the moment your slot opens.
          </p>

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
              <button type="submit">Join the waitlist →</button>
            </form>
          ) : (
            <div className="walk-thanks">
              <p className="thanks-h">You&apos;re in. ✓</p>
              <p className="thanks-b">We&apos;ll email <b className="mono">{email}</b> when your slot opens.</p>
            </div>
          )}

          <p className="walk-fineprint mono">
            No spam. We&apos;ll only email when CreditBowl is ready for you.
          </p>
        </motion.div>
      </section>
    </div>
  )
}

export default Walkthrough
