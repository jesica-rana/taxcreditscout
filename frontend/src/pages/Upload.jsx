import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../strata.css'
import PdfUpload from '../components/PdfUpload.jsx'
// AUTH DISABLED — PDF upload runs without sign-in. Re-enable by un-commenting:
// import AuthChip from '../components/AuthChip.jsx'
// import { useRequireAuth } from '../lib/auth.js'

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

function UploadNav() {
  return (
    <div className="nav">
      <div className="wrap nav-row">
        <Link to="/" className="logo">
          <LogoMark />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>CreditBowl</span>
        </Link>
        <div className="nav-right upload-nav-right">
          <Link to="/quiz" className="nav-skip">
            <span className="nav-skip-full">Skip · answer 5 questions instead →</span>
            <span className="nav-skip-short">Skip →</span>
          </Link>
          {/* <AuthChip /> */}
        </div>
      </div>
    </div>
  )
}

const BADGE_BY_STAGE = {
  idle: 'Local-only · runs entirely in your browser',
  parsing: 'Parsing PDF · 100% client-side',
  redacting: 'Redacting PII · still local',
  preview: 'Review what leaves your device',
  submitting: 'Sending de-identified data only',
}

function PrivacyBand() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Privacy, by topology</span>
            <h2>
              Your tax return never <em>leaves your browser</em>.
            </h2>
          </div>
          <p>
            The redactor is the same code that runs on the landing-page demo.
            Open the source — verify it yourself.
          </p>
        </div>
        <div className="privacy-band">
          <div>
            <h4>Parsed in browser</h4>
            <p>
              <span className="num">100%</span> — your PDF is converted to text
              + image client-side via <code>pdfjs-dist</code>. The file bytes
              never leave your device.
            </p>
          </div>
          <div>
            <h4>Redacted in browser</h4>
            <p>
              Names, SSN, EIN, phone, email, ZIP, address removed via regex +{' '}
              <code>compromise</code> NLP <em>before</em> any network call.
            </p>
          </div>
          <div>
            <h4>You review, then send</h4>
            <p>
              Preview every redacted page side-by-side. Only de-identified line
              items leave your device — and only after you say so.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function GuaranteeBand() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Guarantee</span>
            <h2>
              Find <em>$1,000+</em> in credits — or your money back.
            </h2>
          </div>
          <p>
            Backed by Stripe (256-bit SSL). Refundable for any reason in 7 days.
            We never contact the IRS on your behalf.
          </p>
        </div>
        <div className="coverage-grid">
          <article>
            <b>$1,000</b>
            <span>Money-back floor</span>
            <p>
              If our agents can&apos;t surface at least $1,000 in eligible
              credits, you get a full refund. Most reports clear $14,000.
            </p>
          </article>
          <article>
            <b>7 days</b>
            <span>No-questions refund</span>
            <p>
              Don&apos;t like the report? Email us back inside a week —
              we&apos;ll refund the $10. No friction, no questionnaires.
            </p>
          </article>
          <article>
            <b>0</b>
            <span>SSNs we&apos;ve stored</span>
            <p>
              Stripe handles checkout. PII never touches our servers —
              verifiable in the open-source repo. Not tax advice.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-row">
          <div>
            <Link to="/" className="logo" style={{ marginBottom: 16 }}>
              <LogoMark />
              <span style={{ fontFamily: 'var(--serif)' }}>CreditBowl</span>
            </Link>
            <p style={{ maxWidth: '38ch', marginTop: 16, lineHeight: 1.6 }}>
              Privacy-first tax credit discovery for small businesses. Federal,
              state, and local — all in one bowl.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li>
                <Link to="/upload">Upload tax return</Link>
              </li>
              <li>
                <Link to="/quiz">Answer 5 questions</Link>
              </li>
              <li>
                <Link to="/">Back to homepage</Link>
              </li>
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

function Upload() {
  // AUTH DISABLED — PDF upload runs without sign-in.
  // const { loading, user } = useRequireAuth()
  const [stage, setStage] = useState('idle')

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  // if (loading || !user) return null

  const isReview = stage === 'preview' || stage === 'submitting'

  return (
    <div id="main" className={`strata-page upload-strata ${isReview ? 'is-review' : 'is-intake'}`}>
      <SaleStrip />
      <DeadlineStrip />
      <UploadNav />

      <section className="hero upload-hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="drift" />
          <div className="glow g1" />
          <div className="glow g2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="tile"
              style={{
                left: `${15 + i * 13}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 2.2}s`,
                opacity: 0.3 + (i % 2) * 0.2,
              }}
            />
          ))}
        </div>
        <div className="wrap">
          <div className="upload-hero-grid">
            <div className="upload-hero-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                {isReview ? 'Review what leaves your device' : 'Privacy-first intake'}
              </span>
              <h1 className="hero-title">
                {isReview ? (
                  <>
                    Verify the<br />
                    <em>redaction.</em>
                  </>
                ) : (
                  <>
                    Upload last year&apos;s<br />
                    <em>tax return.</em>
                  </>
                )}
              </h1>
              <p className="hero-sub">
                {isReview ? (
                  <>
                    Click through every page and confirm the redaction looks right.
                    The de-identified text on the right is exactly what our agents
                    will see — your raw PDF stays on your device.
                  </>
                ) : (
                  <>
                    Your PDF is parsed in your browser. Names, SSN, EIN, and
                    addresses are redacted before anything leaves your device.
                    Only de-identified line items reach our agents — privacy
                    enforced by topology, not policy.
                  </>
                )}
              </p>
              {!isReview && (
                <>
                  <ul className="upload-bullets">
                    <li>
                      <span className="bullet-tick">✓</span> Parsed in browser ·{' '}
                      <span className="num">0 bytes</span> uploaded raw
                    </li>
                    <li>
                      <span className="bullet-tick">✓</span> Names, SSN, EIN,
                      address redacted before send
                    </li>
                    <li>
                      <span className="bullet-tick">✓</span> Money-back if we find
                      less than <span className="num">$1,000</span>
                    </li>
                    <li>
                      <span className="bullet-tick">✓</span> 7-day full refund · no
                      questions
                    </li>
                  </ul>
                  <div className="upload-hero-foot">
                    <span className="num">347</span> credits indexed · federal +
                    50 states + 100+ local
                  </div>
                </>
              )}
            </div>
            <div className="upload-card-wrap">
              <div className="upload-card-bar">
                <span className="upload-card-badge" data-stage={stage}>
                  <span className="upload-card-dot" />
                  {BADGE_BY_STAGE[stage] ?? BADGE_BY_STAGE.idle}
                </span>
              </div>
              <PdfUpload hint={null} onStageChange={setStage} />
            </div>
          </div>
        </div>
      </section>

      {!isReview && <PrivacyBand />}
      {!isReview && <GuaranteeBand />}
      <Footer />
    </div>
  )
}

export default Upload
