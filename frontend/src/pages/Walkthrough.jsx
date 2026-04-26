import { useEffect, useRef, useState } from 'react'
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
    title: 'I check the credits worth checking.',
    body: 'R&D, WOTC, Section 179, energy ITC, paid family leave, retirement startup, the major state R&D bonuses. The ~47 federal credits small businesses actually qualify for — scanned in 30 seconds.',
    visual: 'bowl',
  },
  {
    n: '03',
    title: 'You take it to your CPA.',
    body: 'Get a 12-page report with form numbers and a one-page handoff sheet. Your CPA files. I just find what they missed.',
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
  if (kind === 'report') {
    return (
      <div className="feat-card">
        <p className="feat-eyebrow mono">Tax credit audit · 12 pages</p>
        <h3 className="feat-h3">$31,680 in credits</h3>
        <ul className="feat-forms mono">
          <li>▸ Form 6765 · Federal R&amp;D Credit · $20,160</li>
          <li>▸ Form 5884 · WOTC · $3,120</li>
          <li>▸ Form 4562 · §179 Equipment · $8,400</li>
        </ul>
        <p className="feat-handoff mono">→ Email this to your CPA</p>
      </div>
    )
  }
  return null
}

// === Live counters: animate numbers up on mount ===
function CountUpNum({ to, duration = 1400, prefix = '', suffix = '', className = 'mono' }) {
  const [v, setV] = useState(0)
  const ref = useRef()
  useEffect(() => {
    let raf
    const start = performance.now()
    const target = Number(to) || 0
    function step(now) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <span ref={ref} className={className}>{prefix}{v.toLocaleString()}{suffix}</span>
}

function Walkthrough() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    // Always cache locally as a fallback so the UI never breaks
    let pos = 28
    try {
      const list = JSON.parse(localStorage.getItem('cb-waitlist') || '[]')
      list.push({ email, at: new Date().toISOString() })
      localStorage.setItem('cb-waitlist', JSON.stringify(list))
      pos = 28 + list.length
    } catch {}

    // Try the real backend (proxied via Vite dev server to localhost:3000)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'walkthrough' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.position === 'number') pos = data.position
      }
    } catch {
      // network failure — keep the local position
    }

    setPosition(pos)
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
            <p className="wt-caption mono">Hi. I&apos;m CreditBowl.</p>
          </div>
        </aside>

        {/* RIGHT — content */}
        <section className="wt-feats">
          {/* Live ticker — only numbers we can defend */}
          <div className="wt-ticker">
            <div>
              <CountUpNum to={14200} prefix="$" className="mono wt-ticker-num" />
              <span>typical credit stack</span>
            </div>
            <div className="wt-ticker-div" />
            <div>
              <CountUpNum to={47} className="mono wt-ticker-num" />
              <span>federal credits checked</span>
            </div>
            <div className="wt-ticker-div" />
            <div>
              <CountUpNum to={28} className="mono wt-ticker-num" />
              <span>on the waitlist</span>
            </div>
          </div>

          <header className="wt-intro">
            <p className="kicker mono">Private beta · 100 spots</p>
            <h1 className="wt-h1">
              Your CPA checks <em>6</em>.<br/>
              CreditBowl checks <em>47</em>.
            </h1>
            <p className="wt-sub">
              The 47 federal small-business tax credits — checked against
              your actual return in 30 seconds. State and city credits
              rolling out this summer. Without ever seeing your SSN.
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
                <button type="submit">Save my slot →</button>
              </form>
            ) : (
              <div className="wt-position">
                <div className="wt-position-row">
                  <p className="wt-position-eyebrow mono">You&apos;re in line</p>
                  <p className="wt-position-num mono">#{position}</p>
                  <p className="wt-position-of mono">of 100</p>
                </div>
                <div className="wt-position-bar">
                  <span style={{ width: `${Math.min(100, (position / 100) * 100)}%` }} />
                </div>
                <p className="wt-position-info">
                  We&apos;ll email <b className="mono">{email}</b> the moment your slot opens.
                </p>
                <div className="wt-position-share">
                  <p className="mono">Want to skip the line?</p>
                  <button
                    type="button"
                    className="wt-share-btn"
                    onClick={() => {
                      const url = `https://creditbowl.com/welcome?ref=${encodeURIComponent(email)}`
                      navigator.clipboard?.writeText(url)
                    }}
                  >
                    Copy referral link · skip 50 spots per signup
                  </button>
                </div>
              </div>
            )}
            <p className="waitlist-fineprint mono wt-intro-fp">
              No spam · we email once · scroll to see what I do ↓
            </p>
          </header>

          {/* Trust micro-row — three quick proofs */}
          <div className="wt-trust">
            <div>
              <span className="mono">$10</span>
              <p>per audit</p>
            </div>
            <div>
              <span className="mono">47</span>
              <p>federal credits</p>
            </div>
            <div>
              <span className="mono">0 KB</span>
              <p>SSN data stored</p>
            </div>
          </div>

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

          {/* Reprise */}
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
                <p className="thanks-h">You&apos;re #{position} of 100. ✓</p>
              </div>
            )}
          </motion.article>

          <footer className="wt-foot mono">
            <span>Built after my CPA missed $14K · open source</span>
            <a href="https://github.com/jesica-rana/taxcreditscout" target="_blank" rel="noreferrer">
              github.com/creditbowl
            </a>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Walkthrough
