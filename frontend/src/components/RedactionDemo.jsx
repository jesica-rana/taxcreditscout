// 6-second CSS-keyframed loop. No JS, no Lottie. Pauses on prefers-reduced-motion.

function RedactionDemo() {
  return (
    <div className="redaction-demo" aria-hidden="true">
      <div className="redaction-demo-row">
        <div className="redaction-demo-pdf">
          <p className="redaction-demo-label mono">Your browser</p>
          <div className="redaction-demo-line">
            <span>Name:</span> <span className="redact-cover">John Smith</span>
          </div>
          <div className="redaction-demo-line">
            <span>SSN:</span> <span className="redact-cover redact-cover-2">123-45-6789</span>
          </div>
          <div className="redaction-demo-line">
            <span>EIN:</span> <span className="redact-cover redact-cover-3">12-3456789</span>
          </div>
          <div className="redaction-demo-line">
            <span>Address:</span> <span className="redact-cover redact-cover-4">123 Main St</span>
          </div>
          <div className="redaction-demo-line redaction-demo-keep">
            <span>R&D wages:</span> <span>$184,200</span>
          </div>
          <div className="redaction-demo-line redaction-demo-keep">
            <span>Equipment:</span> <span>$42,800</span>
          </div>
        </div>

        <div className="redaction-demo-arrow" aria-hidden="true">
          <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
            <path d="M2 10 H72 M64 4 L72 10 L64 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="redaction-demo-trip mono">redacted only</p>
        </div>

        <div className="redaction-demo-server">
          <p className="redaction-demo-label mono">Our servers</p>
          <div className="redaction-demo-line"><span>Name:</span> <span className="redact-out">[REDACTED]</span></div>
          <div className="redaction-demo-line"><span>SSN:</span> <span className="redact-out">[REDACTED]</span></div>
          <div className="redaction-demo-line"><span>EIN:</span> <span className="redact-out">[REDACTED]</span></div>
          <div className="redaction-demo-line"><span>Address:</span> <span className="redact-out">[REDACTED]</span></div>
          <div className="redaction-demo-line redaction-demo-keep">
            <span>R&D wages:</span> <span>$184,200</span>
          </div>
          <div className="redaction-demo-line redaction-demo-keep">
            <span>Equipment:</span> <span>$42,800</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RedactionDemo
