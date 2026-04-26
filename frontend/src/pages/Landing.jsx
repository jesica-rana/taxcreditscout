import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../strata.css'
import Redactor from '../components/Redactor.jsx'
import CreditBowl from '../components/Bowl.jsx'
import Atlas from '../components/Atlas.jsx'
import Estimator from '../components/Estimator.jsx'
import Picker from '../components/Picker.jsx'

// === Sale strip — 30h-rolling countdown ===
function calcHrs() {
  const ms = (30 * 3600 - ((Date.now() / 1000) % 3600)) * 1000
  const total = Math.max(0, ms)
  const h = Math.floor(total / 3600000)
  const m = Math.floor((total % 3600000) / 60000)
  const s = Math.floor((total % 60000) / 1000)
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function SaleStrip() {
  const [hrs, setHrs] = useState(calcHrs)
  useEffect(() => {
    const id = setInterval(() => setHrs(calcHrs()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="sale">
      <span className="pulse" />
      <b>48-HR LAUNCH SALE</b>
      <span className="pulse" />
      <span style={{ margin: '0 14px' }}>·</span>
      <span className="strike">$99</span>
      <b>$10 per report</b>
      <span style={{ margin: '0 14px' }}>·</span>
      ends in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{hrs}</b>
    </div>
  )
}

// === Deadline strip — July 4 2026 with ring clock ===
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
              <circle cx="12" cy="12" r={r} fill="none" stroke="var(--accent)" strokeWidth="2"
                strokeDasharray={`${c * pct} ${c}`} strokeDashoffset={c * 0.25} transform="rotate(-90 12 12)" strokeLinecap="round" />
            </svg>
            <span><span className="big">{cd.days}</span> days left</span>
          </span>
        </span>
      </div>
    </div>
  )
}

// === Logo mark — bowl variant ===
function LogoMark() {
  return (
    <span className="logo-mark" style={{ display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
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

// === Nav ===
function Nav() {
  return (
    <div className="nav">
      <div className="wrap nav-row">
        <a href="#" className="logo" onClick={(e) => e.preventDefault()}>
          <LogoMark />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>CreditBowl</span>
        </a>
        <nav className="nav-links">
          <a href="#bowl">Bowl</a>
          <a href="#coverage">Coverage</a>
          <a href="#estimate">Estimate</a>
          <a href="#match">Match</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="nav-right">
          <Link to="/upload" className="nav-cta">Find my credits — $10</Link>
        </div>
      </div>
    </div>
  )
}

// === Hero ===
function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="drift"></div>
        <div className="glow g1"></div>
        <div className="glow g2"></div>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="tile" style={{
            left: `${15 + i * 13}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 2.2}s`,
            opacity: 0.3 + (i % 2) * 0.2,
          }} />
        ))}
      </div>
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Privacy-first credit discovery
            </span>
            <h1 className="hero-title">
              Your accountant is <span className="strike-thru">missing</span><br />
              <em>$14,000</em> in tax credits.
            </h1>
            <p className="hero-sub">
              Upload a tax return — or answer 5 questions. We scan 47 federal,
              200+ state, and 100+ local credits to find every one your business
              qualifies for.
            </p>
            <div className="hero-actions">
              <Link to="/upload" className="btn-primary">
                Find my credits
                <span>
                  <span className="price-old">$99</span>
                  <span className="price-new">$10</span>
                </span>
              </Link>
              <a href="#redactor" className="btn-ghost">▸ See it redact a 1040 first</a>
            </div>
            <div className="micro">
              30-second checkout · <span>12-page PDF</span> · CPA handoff sheet · money-back if &lt; $1,000
            </div>
            <div className="proof">
              <div className="proof-item">
                <div className="proof-num"><em>$14K</em><span className="delta">▲</span></div>
                <div className="proof-label">avg credits found</div>
              </div>
              <div className="proof-item">
                <div className="proof-num">347</div>
                <div className="proof-label">credits indexed</div>
              </div>
              <div className="proof-item">
                <div className="proof-num">0</div>
                <div className="proof-label">SSNs we&apos;ve stored</div>
              </div>
            </div>
          </div>
          <div id="redactor">
            <Redactor />
          </div>
        </div>
      </div>
    </section>
  )
}

// === Footer ===
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-row">
          <div>
            <a href="#" className="logo" style={{ marginBottom: 16 }}>
              <LogoMark />
              <span style={{ fontFamily: 'var(--serif)' }}>CreditBowl</span>
            </a>
            <p style={{ maxWidth: '38ch', marginTop: 16, lineHeight: 1.6 }}>
              Privacy-first tax credit discovery for small businesses. Federal,
              state, and local — all in one bowl.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link to="/upload">Upload tax return</Link></li>
              <li><Link to="/quiz">Answer 5 questions</Link></li>
              <li><a href="#estimate">Quick estimator</a></li>
              <li><a href="#redactor">Privacy demo</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><a href="https://github.com/jesica-rana/taxcreditscout" target="_blank" rel="noreferrer">Open source</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-disclaim">
          <span>© 2026 CreditBowl. Informational research, not tax advice.</span>
          <span>Verify all findings with a qualified CPA before filing.</span>
        </div>
      </div>
    </footer>
  )
}

function Landing() {
  // Force dark mode — single visual palette
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  return (
    <div id="main" className="strata-page">
      <SaleStrip />
      <DeadlineStrip />
      <Nav />
      <Hero />

      <section className="section" id="bowl">
        <div className="wrap">
          <CreditBowl />
        </div>
      </section>

      <section className="section" id="coverage">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">Coverage</span>
              <h2>Your CPA knows 6 federal credits.<br />We index <em>every</em> jurisdiction.</h2>
            </div>
            <p>Hover any state to see the federal-state-local stack we&apos;ll search for your business.</p>
          </div>
          <Atlas />
        </div>
      </section>

      <section className="section" id="estimate">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">Estimate</span>
              <h2>Three sliders. <em>Real money.</em></h2>
            </div>
            <p>This estimate becomes the floor of your money-back guarantee. If we find less, you pay nothing.</p>
          </div>
          <Estimator />
        </div>
      </section>

      <section className="section" id="match">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">Match</span>
              <h2>What did your business <em>actually do</em> last year?</h2>
            </div>
            <p>Tap activities — credits light up. No form-filling, no commitment.</p>
          </div>
          <Picker />
        </div>
      </section>

      <section className="section" id="privacy">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">Privacy, shown</span>
              <h2>Your tax return never <em>leaves your browser</em>.</h2>
            </div>
            <p>The redactor at the top of the page is the real one — not a demo. The same code runs when you upload your PDF.</p>
          </div>
          <div className="privacy-band">
            <div>
              <h4>Parsed in browser</h4>
              <p><span className="num">100%</span> — your PDF is converted to text + image client-side via <code>pdfjs-dist</code>. The file bytes never leave your device.</p>
            </div>
            <div>
              <h4>Redacted in browser</h4>
              <p>Names, SSN, EIN, phone, email, ZIP, address removed via regex + <code>compromise</code> NLP <em>before</em> any network call.</p>
            </div>
            <div>
              <h4>Verifiable</h4>
              <p>The redactor at the top of this page runs the exact regex + NLP that ships with the production app.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Landing
