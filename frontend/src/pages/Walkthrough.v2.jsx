import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../strata.css'

// Documents dropping INTO the mascot's bowl
const DOCS = [
  { id: 1, label: 'R&D Credit',  amt: '$20,160', cls: 'doc-accent', delay: 2.6, x: -50, rot: -8 },
  { id: 2, label: 'WOTC',         amt: '$3,120',  cls: 'doc-money',  delay: 2.95, x:  40, rot: 6 },
  { id: 3, label: 'Sec. 179',     amt: '$8,400',  cls: 'doc-paper',  delay: 3.30, x:   0, rot: -3 },
]

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
    <div id="main" className="strata-page waitlist-page">
      <header className="waitlist-top">
        <Link to="/" className="walk-brand">
          <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="" width="32" height="32" />
          <span>CreditBowl</span>
        </Link>
      </header>

      <main className="waitlist-stage">
        {/* Bowl mascot — actual walk cycle */}
        <div className="walk-zone">
          <motion.div
            className="walk-in-mascot walking"
            initial={{ x: '-60vw' }}
            animate={{ x: 0 }}
            transition={{ duration: 2.0, ease: [0.4, 0.05, 0.5, 0.95] }}
            onAnimationComplete={() => {
              const el = document.querySelector('.walk-in-mascot')
              if (el) el.classList.remove('walking'), el.classList.add('arrived')
            }}
          >
            <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="CreditBowl mascot" />
          </motion.div>

          {/* Documents drop INTO his bowl after he stops walking */}
          {DOCS.map((d) => (
            <motion.div
              key={d.id}
              className={`doc-chip ${d.cls}`}
              initial={{ opacity: 0, y: -300, x: d.x, rotate: 0 }}
              animate={{ opacity: 1, y: 0, x: d.x, rotate: d.rot }}
              transition={{
                delay: d.delay,
                duration: 0.65,
                ease: [0.4, 0, 0.45, 1.4],
              }}
            >
              <span className="doc-name">{d.label}</span>
              <span className="doc-amt mono">{d.amt}</span>
            </motion.div>
          ))}
        </div>

        {/* Tiny preview snippet — feels like a peek of the real product */}
        <motion.div
          className="site-preview"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 4.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="preview-chrome">
            <span /><span /><span />
            <span className="preview-url mono">creditbowl.com</span>
          </div>
          <div className="preview-body">
            <p className="preview-eyebrow mono">Tax credit audit · Acme Co</p>
            <h3 className="preview-total mono">$31,680</h3>
            <p className="preview-summary">across 3 credits — federal, state, and local.</p>
            <div className="preview-rows">
              <div><span>R&amp;D Credit</span><b className="mono">$20,160</b></div>
              <div><span>Sec. 179</span><b className="mono">$8,400</b></div>
              <div><span>WOTC</span><b className="mono">$3,120</b></div>
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="waitlist-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="kicker mono">Coming soon</p>
          <h1 className="waitlist-h1">
            Be first<br/>to <em>fill the bowl.</em>
          </h1>
        </motion.div>

        {/* Form */}
        <motion.div
          className="waitlist-form-wrap"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
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
              <p className="thanks-b">We&apos;ll email <b className="mono">{email}</b> when your slot opens.</p>
            </div>
          )}
          <p className="waitlist-fineprint mono">
            No spam · we email once, when you&apos;re up
          </p>
        </motion.div>
      </main>
    </div>
  )
}

export default Walkthrough
