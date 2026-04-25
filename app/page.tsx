import Link from "next/link";
import DeadlineBanner from "@/components/DeadlineBanner";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <DeadlineBanner />

      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif leading-tight">
          Your accountant is missing{" "}
          <span className="text-money">$14,000</span> in tax credits.
        </h1>
        <p className="mt-6 text-2xl font-semibold text-money inline-flex items-center gap-2">
          🔒 We never see your SSN.
        </p>
        <p className="mt-4 text-xl text-ink/80 max-w-2xl">
          Upload your tax return — or answer 5 questions. Either way, our AI
          scans 47 federal, 200+ state, and 100+ local tax credits to find every
          one your business qualifies for. PDFs are parsed and redacted
          <strong> in your browser</strong> — nothing personal ever leaves your
          device.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Link
            href="/intake"
            className="inline-block bg-ink text-paper px-8 py-4 text-lg font-semibold rounded-md hover:bg-ink/90 transition"
          >
            Find My Credits — $99
          </Link>
          <span className="text-sm text-ink/60">
            Money-back if we find less than $1,000
          </span>
        </div>
        <p className="mt-4 text-sm text-ink/50">
          30-second checkout · 12-page PDF · CPA handoff sheet included
        </p>
      </section>

      <section className="px-6 py-16 bg-paper border-t border-ink/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-10">How we protect your data</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold mb-2">
                PDF parsed in your browser
              </h3>
              <p className="text-ink/70">
                Your tax return never touches our servers. We use{" "}
                <code className="text-sm">pdfjs-dist</code> to read the file
                locally, then strip every piece of PII before any network
                request.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">✏️</div>
              <h3 className="text-lg font-semibold mb-2">
                You review every redaction
              </h3>
              <p className="text-ink/70">
                SSN, EIN, name, address, phone, account numbers — all stripped
                client-side. The preview UI shows you exactly what's being
                removed before you approve.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🗑</div>
              <h3 className="text-lg font-semibold mb-2">Nothing stored</h3>
              <p className="text-ink/70">
                Our pipeline only sees de-identified line items. Reports
                auto-delete after 90 days. The code is{" "}
                <a
                  href="https://github.com/jesica-rana/taxcreditscout"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  open-source
                </a>{" "}
                — verify it yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-ink text-paper">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-10">What we check</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl font-serif text-accent">47</div>
              <h3 className="text-xl mt-2 mb-3">Federal Credits</h3>
              <p className="text-paper/70">
                R&amp;D, WOTC, Section 179, Health Care, Pension Startup, Paid
                Family Leave, New Markets, Empowerment Zone, Disabled Access,
                and 38 more.
              </p>
            </div>
            <div>
              <div className="text-5xl font-serif text-accent">200+</div>
              <h3 className="text-xl mt-2 mb-3">State Credits</h3>
              <p className="text-paper/70">
                California Research Credit, Texas R&amp;D Credit, NY Investment
                Credit, FL Capital Investment, plus 50-state coverage.
              </p>
            </div>
            <div>
              <div className="text-5xl font-serif text-accent">100+</div>
              <h3 className="text-xl mt-2 mb-3">Local Credits</h3>
              <p className="text-paper/70">
                NYC ICAP, LA Enterprise Zone, Chicago TIF, opportunity zones in
                8,764 census tracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-serif mb-4">Why this exists</h2>
        <p className="text-lg text-ink/80 max-w-3xl leading-relaxed">
          Most CPAs only know about 5–6 federal credits. There are 47 federal
          credits, plus 200+ state, plus 100+ local. We index every credit
          across every jurisdiction. Your CPA still files your return — we just
          hand them a list of what to claim.
        </p>
      </section>

      <section className="px-6 py-16 bg-paper border-t border-ink/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: 1,
                t: "Tell us about your business",
                d: "5 questions, 60 seconds. No login.",
              },
              {
                n: 2,
                t: "Our AI matches you",
                d: "Against every credit in our database in real time.",
              },
              {
                n: 3,
                t: "Get your report",
                d: "12 pages, every credit you qualify for, with IRS form numbers and a CPA handoff sheet.",
              },
            ].map((s) => (
              <div key={s.n}>
                <div className="text-5xl font-serif text-accent">{s.n}</div>
                <h3 className="text-xl mt-2 mb-2">{s.t}</h3>
                <p className="text-ink/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-serif mb-8">FAQ</h2>
        <dl className="space-y-6">
          {FAQ.map((q) => (
            <div key={q.q}>
              <dt className="text-lg font-semibold">{q.q}</dt>
              <dd className="mt-2 text-ink/70">{q.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="px-6 py-12 border-t border-ink/10 text-center text-sm text-ink/50">
        <p>
          Disclaimer: This product provides informational research and is not
          tax advice. All findings should be verified with a qualified CPA or
          tax attorney before filing.
        </p>
        <p className="mt-2">© 2026 TaxCreditScout</p>
      </footer>
    </main>
  );
}

const FAQ = [
  {
    q: "Do you see my SSN or tax return?",
    a: "No. If you upload a PDF, it's parsed and redacted entirely in your browser before anything is sent. Our backend only ever sees de-identified line items. You can verify this yourself in the open-source repo.",
  },
  {
    q: "Is this tax advice?",
    a: "No. We're a discovery tool. Take the report to your CPA, who files your return.",
  },
  {
    q: "What if I find no credits?",
    a: "We refund you in full if we find less than $1,000.",
  },
  {
    q: "Will my CPA be mad?",
    a: "They'll be relieved. We hand them a single-page summary so the work is faster, not slower.",
  },
  {
    q: "How does the AI know?",
    a: "We've indexed every credit from IRS.gov, state Departments of Revenue, and 50+ city programs. The AI matches your business profile against eligibility text.",
  },
  {
    q: "Is my data safe?",
    a: "Stored encrypted, deleted after 90 days, never sold.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes — 7-day full refund, no questions.",
  },
];
