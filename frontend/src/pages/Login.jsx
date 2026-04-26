import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../strata.css'

// Only allow same-app redirects — never bounce to an external URL via ?next=
function safeNextPath(raw) {
  if (!raw || typeof raw !== 'string') return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

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

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get('next')) ?? '/dashboard',
    [searchParams]
  )

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Force dark — single visual palette, matches Landing
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  // If already signed in, skip the page
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) navigate(nextPath, { replace: true })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [navigate, nextPath])

  const isSignup = mode === 'signup'

  function switchMode(next) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const payload = isSignup
        ? { email, password, name: name.trim() || null }
        : { email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || (isSignup ? 'Could not create account.' : 'Could not sign in.'))
        setSubmitting(false)
        return
      }

      navigate(nextPath, { replace: true })
    } catch {
      setError('Network error — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main id="main" className="strata-page auth-page">
      <nav className="auth-nav" aria-label="Primary">
        <Link to="/" className="logo">
          <LogoMark />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>CreditBowl</span>
        </Link>
        <Link to="/" className="auth-nav-back">← Back to home</Link>
      </nav>

      <motion.section
        className="auth-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-card">
          <header className="auth-head">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {isSignup ? 'Create your account' : 'Welcome back'}
            </span>
            <h1 className="auth-title">
              {isSignup ? (<>Save every credit<br /><em>your business earns.</em></>) : (<>Sign in to your<br /><em>CreditBowl</em>.</>)}
            </h1>
            <p className="auth-sub">
              {isSignup
                ? 'Free account. Keep every report you generate, in one private bowl.'
                : 'Pick up where you left off — your saved reports and credit history.'}
            </p>
          </header>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`auth-tab ${!isSignup ? 'is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`auth-tab ${isSignup ? 'is-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <label className="auth-field">
                <span className="auth-label">Name <span className="auth-optional">optional</span></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Founder"
                  autoComplete="name"
                  maxLength={80}
                  className="auth-input"
                />
              </label>
            )}

            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                required
                className="auth-input"
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">
                Password
                {isSignup && <span className="auth-optional">8+ characters</span>}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={isSignup ? 8 : 1}
                className="auth-input"
              />
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'One moment…' : (isSignup ? 'Create account' : 'Sign in')}
              <span className="auth-submit-arrow" aria-hidden="true">→</span>
            </button>

            <p className="auth-switch">
              {isSignup ? (
                <>Already have an account?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('login')}>Sign in</button>
                </>
              ) : (
                <>New to CreditBowl?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('signup')}>Create an account</button>
                </>
              )}
            </p>
          </form>

          <div className="auth-trust">
            <div className="auth-trust-item">
              <span className="auth-trust-num">0</span>
              <span className="auth-trust-label">SSNs we&apos;ve stored</span>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-num">347</span>
              <span className="auth-trust-label">credits indexed</span>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-num"><em>$14K</em></span>
              <span className="auth-trust-label">avg credits found</span>
            </div>
          </div>
        </div>

        <p className="auth-foot">
          By {isSignup ? 'creating an account' : 'signing in'} you agree CreditBowl is informational research, not tax advice. Verify findings with a qualified CPA before filing.
        </p>
      </motion.section>
    </main>
  )
}

export default Login
