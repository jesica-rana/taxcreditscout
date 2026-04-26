import { useMemo, useState } from 'react'
import { PII_TYPE_LABELS } from '../lib/redactor.js'

function RedactionPreview({ pages, tokens, reviewed, setReviewed, onSubmit, onReset, submitting, error }) {
  const [activePage, setActivePage] = useState(0)

  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of tokens) map.set(t.type, (map.get(t.type) ?? 0) + 1)
    return Array.from(map.entries())
  }, [tokens])

  const page = pages[activePage]

  return (
    <div className="redaction-shell">
      <div className="redaction-banner">
        <span className="redaction-lock">🔒</span>
        <div>
          <p className="redaction-title">
            Redaction complete · {tokens.length} pieces of personal information removed
          </p>
          <p className="redaction-sub">
            Nothing has left your browser yet. Review what we&apos;re sending below.
          </p>
        </div>
      </div>

      <div className="redaction-grid">
        <aside className="redaction-summary">
          <p className="eyebrow">What we removed</p>
          {grouped.length === 0 ? (
            <p className="redaction-empty">No PII detected. Your PDF text was already clean.</p>
          ) : (
            <ul>
              {grouped.map(([type, count]) => (
                <li key={type}>
                  <span>{PII_TYPE_LABELS[type] || type}</span>
                  <span className="mono">×{count}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="eyebrow" style={{ marginTop: 24 }}>What stays</p>
          <ul className="redaction-keep">
            <li>Financial line items (income, expenses)</li>
            <li>Form numbers and dollar amounts</li>
            <li>State / industry signals</li>
          </ul>

          {pages.length > 1 && (
            <div className="page-tabs">
              {pages.map((p, i) => (
                <button
                  type="button"
                  key={p.pageNumber}
                  className={i === activePage ? 'page-tab page-tab-active' : 'page-tab'}
                  onClick={() => setActivePage(i)}
                >
                  Page {p.pageNumber}
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="redaction-image">
          <p className="image-label mono">
            Page {page?.pageNumber} · what the agents see
          </p>
          {page && (
            <img src={page.redactedImageDataUrl} alt={`Redacted page ${page.pageNumber}`} />
          )}
        </div>
      </div>

      <label className="redaction-confirm">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        <span>I&apos;ve reviewed what gets sent. Run the agents.</span>
      </label>

      {error && <p className="upload-error">{error}</p>}

      <div className="redaction-actions">
        <button type="button" className="button secondary" onClick={onReset} disabled={submitting}>
          Use a different file
        </button>
        <button
          type="button"
          className="button primary large"
          onClick={onSubmit}
          disabled={!reviewed || submitting}
        >
          {submitting ? 'Running agents…' : 'Send redacted version →'}
        </button>
      </div>
    </div>
  )
}

export default RedactionPreview
