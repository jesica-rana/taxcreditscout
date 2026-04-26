// Fake-browser-chrome card showing what the report looks like.
// HTML-rendered (no real screenshot needed) so it auto-themes with the rest of the site.

const SAMPLE_CREDITS = [
  { name: 'Research and Development Credit', range: '$8,400 – $12,200', form: 'Form 6765' },
  { name: 'Work Opportunity Tax Credit', range: '$2,400 – $9,600', form: 'Form 5884' },
  { name: 'Small Employer Health Care', range: '$1,200 – $4,800', form: 'Form 8941' },
]

function SampleReportPreview() {
  return (
    <figure className="sample-report">
      <div className="sample-chrome">
        <span /><span /><span />
        <span className="sample-url mono">taxcreditfinder.com/report/<span className="muted">a3f2…</span></span>
      </div>
      <div className="sample-body">
        <p className="sample-eyebrow">Tax Credit Audit · Acme Marketing Co</p>
        <h3 className="sample-total">$23,400</h3>
        <p className="sample-summary">12-person digital marketing agency in Austin, TX. We screened 347 federal, state, and local credits and found 7 matches.</p>

        <div className="sample-credits">
          {SAMPLE_CREDITS.map((c) => (
            <div className="sample-credit" key={c.name}>
              <div>
                <p className="sample-credit-name">{c.name}</p>
                <p className="sample-credit-meta mono">{c.form}</p>
              </div>
              <strong className="sample-credit-range mono">{c.range}</strong>
            </div>
          ))}
          <div className="sample-credit sample-fade">
            <span>+ 4 more credits in your full report</span>
          </div>
        </div>
      </div>
      <figcaption className="sample-caption">
        Sample report for a fictional 12-person agency. See your real numbers in 5 minutes.
      </figcaption>
    </figure>
  )
}

export default SampleReportPreview
