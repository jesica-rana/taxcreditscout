import { Link } from 'react-router-dom'
import '../strata.css'

const EFFECTIVE = 'April 25, 2026'
const PROJECT = 'CreditBowl'
const CONTACT = 'hello@creditbowl.com'
const STATE = 'California'

function Terms() {
  return (
    <main id="main" className="strata-page legal-page">
      <nav className="nav">
        <div className="wrap nav-row">
          <Link to="/" className="logo">
            <img className="mascot-img" src="/assets/creditbowl-logo.svg" alt="" width="36" height="36" />
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}>{PROJECT}</span>
          </Link>
          <div className="nav-right">
            <Link to="/" className="text-link">← Back to home</Link>
          </div>
        </div>
      </nav>

      <article className="legal-doc">
        <header className="legal-head">
          <p className="kicker">Legal · Terms of Use</p>
          <h1>Terms &amp; Conditions</h1>
          <p className="legal-meta">
            <span>Last updated: <b>{EFFECTIVE}</b></span>
          </p>
        </header>

        <section className="legal-summary">
          <p>
            <strong>The short version.</strong> {PROJECT} is an experimental
            project, not an incorporated company. We help small businesses
            discover federal, state, and local tax credits they may qualify
            for. We do not file returns, give tax advice, or represent you
            before the IRS. Reports are informational research that you take
            to a CPA. Your raw tax return never leaves your browser. If we
            charge for a report and find less than $1,000 in credits, we
            refund you.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">1. Acceptance</h2>
          <p>
            These Terms govern your use of {PROJECT} (the &ldquo;Service&rdquo;) at
            creditbowl.com and any subdomain. By using the Service, you agree
            to these Terms. If you use the Service on behalf of a business,
            you represent you are authorized to bind that business.
          </p>
          <p>
            You must be at least 18 years old.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">2. What the Service is</h2>
          <p>
            {PROJECT} accepts a business profile (employee count, state,
            activities) or, optionally, a tax-return PDF that is parsed and
            redacted in your browser. It runs an AI pipeline against an
            indexed database of tax credits and produces a written report
            with estimated dollar ranges, IRS form numbers, and suggested
            action steps. The report is delivered as a PDF and email summary.
          </p>
          <p>
            <strong>The Service is a research and discovery tool. It is not
            tax preparation, accounting, legal, or financial advice.</strong>
          </p>
        </section>

        <section>
          <h2 className="legal-h2">3. Not tax advice</h2>
          <div className="legal-callout">
            <p>
              <strong>{PROJECT} is not a Certified Public Accountant (CPA),
              Enrolled Agent (EA), tax attorney, or registered tax preparer.
              Nothing on this site is tax, legal, accounting, or financial
              advice.</strong>
            </p>
          </div>
          <p>You acknowledge that:</p>
          <ul>
            <li>All reports, estimates, and recommendations are informational research only.</li>
            <li>You will verify every credit with a qualified tax professional before claiming it.</li>
            <li>We do not prepare, sign, or file any tax return on your behalf.</li>
            <li>We do not represent you before the IRS or any state taxing authority.</li>
            <li>Estimates are based on general statutory information and the limited inputs you provide; they are not guarantees of any tax outcome.</li>
            <li>Tax law changes; a credit identified today may not be available tomorrow.</li>
          </ul>
          <p>
            No client, attorney-client, or accountant-client relationship is
            created by your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">4. Privacy &amp; data</h2>
          <p>
            Privacy is the core of how {PROJECT} works. PDFs you upload are
            parsed in your browser. Names, SSN, EIN, addresses, phone, and
            email are redacted in your browser before any network call. Only
            de-identified financial line items reach our servers. The full
            list of data we receive, how long we keep it, and how to delete
            it is in the <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">5. Payments and refunds</h2>
          <p>
            Pricing is shown at checkout. Payments are processed by Stripe;
            we do not store full card numbers. Prices exclude any applicable
            sales tax. Promotional pricing (launch sales, etc.) is honored
            only while advertised.
          </p>
          <p>
            <strong>Money-back guarantee.</strong> If your audit identifies less
            than $1,000 in total estimated credits, email{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> within 30 days for a
            full refund.
          </p>
          <p>
            <strong>7-day refund.</strong> For any reason, you can request a
            refund within 7 days of purchase. We process refunds within 5–10
            business days to the original payment method.
          </p>
          <p>
            <strong>Chargebacks.</strong> Please contact us before initiating a
            chargeback. We will resolve any reasonable billing concern.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">6. Acceptable use</h2>
          <p>You will not:</p>
          <ul>
            <li>Use the Service for tax fraud, identity theft, or misrepresentation to any taxing authority.</li>
            <li>Upload documents you do not have the legal right to access.</li>
            <li>Try to circumvent the redaction or extract data about other users&apos; sessions.</li>
            <li>Reverse engineer, scrape, or resell the Service without written permission.</li>
            <li>Use the Service in violation of any law, including export controls and sanctions.</li>
          </ul>
          <p>We may suspend access for any violation, with or without notice.</p>
        </section>

        <section>
          <h2 className="legal-h2">7. Open source</h2>
          <p>
            Portions of the codebase are open source under their respective
            licenses. You can review them at{' '}
            <a href="https://github.com/jesica-rana/taxcreditscout" target="_blank" rel="noreferrer">github.com/jesica-rana/taxcreditscout</a>. The
            indexed credit database, prompts, and proprietary code are owned
            by the {PROJECT} maintainers.
          </p>
          <p>
            You retain ownership of the data you submit. Your generated
            report is licensed to you for use within your business and for
            handoff to your tax professional.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">8. Third-party services</h2>
          <p>
            The Service uses Anthropic and OpenAI (LLM inference), Voyage AI
            (embeddings), Qdrant Cloud (vector database), Stripe (payments),
            Resend (email), and Vercel (hosting). The full list with what
            data each receives is in the{' '}
            <Link to="/privacy">Privacy Policy</Link>. We are not responsible
            for the acts or omissions of these providers.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">9. Limitations</h2>
          <p>
            <strong>The Service is provided &ldquo;as is&rdquo;.</strong> We make no warranty
            that it will be uninterrupted, accurate, or fit for any
            particular purpose. We do not warrant that any specific credit
            will be available, available at the dollar amount estimated, or
            accepted by any taxing authority.
          </p>
          <p>
            <strong>To the extent permitted by law, our total liability is
            limited to the amount you paid us in the 12 months before the
            claim, or $100, whichever is greater.</strong> We are not liable for
            indirect, incidental, or consequential damages, including tax
            penalties or professional fees paid to third parties.
          </p>
          <p>
            You agree to defend and indemnify the {PROJECT} maintainers
            against any claim arising from your use of the Service, your
            violation of these Terms, or any tax position taken by you or
            anyone acting on your behalf.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">10. Changes and termination</h2>
          <p>
            We may update these Terms; the &ldquo;Last updated&rdquo; date reflects the
            current version. Continued use after a change means you accept
            the revised Terms.
          </p>
          <p>
            We may suspend or end access at any time, with or without notice.
            You can stop using the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">11. Disputes</h2>
          <p>
            Before filing a claim, please contact us at{' '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and try to resolve it
            informally for at least 30 days. We promise to do the same.
          </p>
          <p>
            These Terms are governed by the laws of the State of {STATE},
            without regard to conflict-of-law rules. Any dispute that can&apos;t
            be resolved informally will be brought in the state or federal
            courts located in {STATE}, and you consent to that jurisdiction.
            Either party may bring a qualifying claim in small-claims court.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">12. General</h2>
          <p>
            If any part of these Terms is found unenforceable, the rest stays
            in effect. Failure to enforce a right is not a waiver of it. You
            may not assign these Terms without our consent. Sections that by
            their nature should survive (3, 4, 7, 9, 11) survive termination.
          </p>
        </section>

        <section>
          <h2 className="legal-h2">13. Contact</h2>
          <p>
            Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </section>

        <footer className="legal-foot">
          <p>
            <Link to="/privacy">Privacy Policy</Link> ·{' '}
            <Link to="/">Back to home</Link> ·{' '}
            <a href="https://github.com/jesica-rana/taxcreditscout" target="_blank" rel="noreferrer">Open source</a>
          </p>
          <p className="legal-disclaim">
            © 2026 {PROJECT}. {PROJECT} is an experimental project. Not a
            CPA, EA, tax attorney, or registered tax preparer. The Service
            provides informational research and is not tax advice.
          </p>
        </footer>
      </article>
    </main>
  )
}

export default Terms
