import { Link } from 'react-router-dom'
import '../strata.css'

const EFFECTIVE = 'April 25, 2026'
const PROJECT = 'CreditBowl'
const CONTACT = 'privacy@creditbowl.com'

function Privacy() {
  return (
    <main id="main" className="strata-page legal-page">
      <nav className="nav">
        <div className="wrap nav-row">
          <Link to="/" className="logo">
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>{PROJECT}</span>
          </Link>
          <div className="nav-right">
            <Link to="/" className="text-link">← Back to home</Link>
          </div>
        </div>
      </nav>

      <article className="legal-doc">
        <header className="legal-head">
          <p className="kicker">Legal · Privacy</p>
          <h1>Privacy Policy</h1>
          <p className="legal-meta">
            <span>Last updated: <b>{EFFECTIVE}</b></span>
          </p>
        </header>

        <section className="legal-summary">
          <p>
            <strong>The short version.</strong> Your tax return never reaches
            our servers. PDFs are parsed and redacted in your browser. Names,
            SSN, EIN, addresses, phone, and email are stripped before any
            network call. We receive only de-identified financial line items.
            We don&apos;t sell your data. We don&apos;t use it to train third-party
            AI models. We delete it after 90 days. Email{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> to delete it sooner.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">1. What we collect</h2>
          <p><strong>From you, directly:</strong></p>
          <ul>
            <li>
              <strong>Business profile.</strong> The description you type,
              your state, optional city, employee count, revenue band, and
              activity tags you select.
            </li>
            <li>
              <strong>Email address</strong> if you ask to have a report
              emailed.
            </li>
            <li>
              <strong>Payment information</strong> via Stripe. We see a
              Stripe payment ID, last four of the card, and billing zip — not
              the full card number.
            </li>
            <li>
              <strong>De-identified document text</strong> if you upload a
              PDF. We receive the redacted text (with{' '}
              <code>[REDACTED:TYPE]</code> markers replacing PII) and a
              redaction-overlaid image of each page. We do not receive the
              raw PDF.
            </li>
          </ul>
          <p><strong>Automatically:</strong></p>
          <ul>
            <li>
              <strong>Technical data:</strong> IP address (truncated for
              analytics), user agent, referrer, pages visited.
            </li>
            <li>
              <strong>Session ID:</strong> a random UUID stored in your
              browser to retrieve your report.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="legal-h2">2. How we use it</h2>
          <ul>
            <li>Run the agent pipeline that produces your credit report.</li>
            <li>Email your report (only if you provide an email).</li>
            <li>Process payments and prevent fraud.</li>
            <li>Improve prompts and credit data using only de-identified inputs.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We <strong>do not</strong> use your data to train third-party
            general-purpose AI models. The LLM providers we use (Anthropic,
            OpenAI) operate under enterprise terms that prohibit training on
            customer inputs.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">3. What stays on your device</h2>
          <p>
            The privacy promise is enforced by topology, not policy. These
            never leave your browser:
          </p>
          <ul>
            <li>
              <strong>Raw PDF bytes.</strong> The file is read into browser
              memory and processed client-side. It&apos;s never uploaded.
            </li>
            <li>
              <strong>Unredacted PII.</strong> Names, SSN, EIN, phone, email,
              ZIP, address are detected and replaced with{' '}
              <code>[REDACTED:TYPE]</code> markers before any network call.
            </li>
            <li>
              <strong>Original PII values.</strong> If you download a final
              PDF that includes your name on the cover, those tokens are
              re-injected client-side from session storage. They&apos;re never
              transmitted to us.
            </li>
          </ul>
          <p>
            You can verify this in our open-source code:{' '}
            <a href="https://github.com/jesica-rana/taxcreditscout/tree/main/lib" target="_blank" rel="noreferrer">github.com/jesica-rana/taxcreditscout</a>{' '}
            — see <code>pdf-parser.ts</code> and <code>redactor.ts</code>.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">4. Who we share with</h2>
          <p>
            We use third-party services to deliver the Service. Each receives
            only what it needs to do its job:
          </p>
          <table className="legal-table">
            <thead>
              <tr><th>Service</th><th>Purpose</th><th>Data shared</th></tr>
            </thead>
            <tbody>
              <tr><td>Anthropic</td><td>LLM inference</td><td>De-identified profile + redacted text</td></tr>
              <tr><td>OpenAI</td><td>Backup LLM, embeddings</td><td>De-identified queries</td></tr>
              <tr><td>Voyage AI</td><td>Embeddings</td><td>De-identified queries</td></tr>
              <tr><td>Qdrant Cloud</td><td>Vector database</td><td>Embeddings + credit metadata</td></tr>
              <tr><td>Vercel</td><td>Hosting</td><td>HTTP requests, session metadata</td></tr>
              <tr><td>Stripe</td><td>Payments</td><td>Email, billing zip, payment method</td></tr>
              <tr><td>Resend</td><td>Email delivery</td><td>Email address, report content</td></tr>
            </tbody>
          </table>
          <p>
            We do <strong>not</strong> sell or rent your data. We do not share
            it with advertisers. We may disclose data when required by law
            (e.g., a valid subpoena).
          </p>
        </section>

        <section>
          <h2 className="legal-h2">5. Retention &amp; deletion</h2>
          <p>
            We keep de-identified session data for up to <strong>90 days</strong>,
            then delete it. Email records of report deliveries are kept up
            to 24 months for support. Payment records are kept per Stripe&apos;s
            requirements (typically 7 years) for accounting compliance.
          </p>
          <p>
            You can request earlier deletion any time by emailing{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> with your session ID
            (in the URL of your report) or your purchase email. We&apos;ll
            confirm deletion within 30 days.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">6. Your rights</h2>
          <p>
            Depending on where you live, you can ask us to access, correct,
            delete, or stop processing your data. California, EU, and UK
            residents have additional rights under CCPA/CPRA and GDPR. To
            exercise any right, email{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">7. Cookies &amp; storage</h2>
          <p>
            We use a small set of essential browser-storage entries:
          </p>
          <ul>
            <li><code>tcf-theme</code> — theme preference.</li>
            <li>
              <code>taxCreditAnswers</code>, <code>taxCreditReport</code>,{' '}
              <code>taxCreditMode</code> — your in-progress intake and
              rendered report. Cleared when the tab closes.
            </li>
            <li>
              <code>pii:&lt;sessionId&gt;</code> — sessionStorage holding
              redacted PII tokens for client-side re-injection at PDF
              download. Never sent to our servers.
            </li>
          </ul>
          <p>
            You can clear browser storage at any time via your browser
            settings. We do not use third-party advertising trackers.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">8. Security</h2>
          <p>
            We use TLS 1.2+ for data in transit, encryption at rest, and
            principle-of-least-privilege access. The strongest protection is
            architectural — we don&apos;t collect what we don&apos;t need. If you
            find a vulnerability, email{' '}
            <a href="mailto:security@creditbowl.com">security@creditbowl.com</a>{' '}
            before public disclosure. We respond within 5 business days.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">9. Children</h2>
          <p>
            The Service isn&apos;t for anyone under 18. We don&apos;t knowingly
            collect data from children. If you believe a child has provided
            us with information, email{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we&apos;ll delete it.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">10. Changes</h2>
          <p>
            We may update this policy. The &ldquo;Last updated&rdquo; date reflects the
            current version. Material changes will be announced on the
            website and, where we have your email, by email.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">11. Contact</h2>
          <p>
            Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. For security
            issues, email{' '}
            <a href="mailto:security@creditbowl.com">security@creditbowl.com</a>.
          </p>
        </section>

        <footer className="legal-foot">
          <p>
            <Link to="/terms">Terms &amp; Conditions</Link> ·{' '}
            <Link to="/">Back to home</Link> ·{' '}
            <a href="https://github.com/jesica-rana/taxcreditscout" target="_blank" rel="noreferrer">Open source</a>
          </p>
          <p className="legal-disclaim">
            © 2026 {PROJECT}.
          </p>
        </footer>
      </article>
    </main>
  )
}

export default Privacy
