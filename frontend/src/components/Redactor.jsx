import { useState, useEffect, useMemo, useRef } from "react"

const REDACTOR_LINES = [
  { t: 'Form 1040 — U.S. Individual Income Tax Return', k: 'h' },
  { t: 'Tax Year 2024', k: 'sub' },
  { t: ['Name: ', { p: 'PERSON', v: 'Marcus T. Whitfield' }], k: 'row' },
  { t: ['Spouse: ', { p: 'PERSON', v: 'Elena R. Whitfield' }], k: 'row' },
  { t: ['SSN: ', { p: 'SSN', v: '412-66-8830' }], k: 'row' },
  { t: ['Address: ', { p: 'ADDRESS', v: '2418 Magnolia Ridge Dr, Austin TX 78704' }], k: 'row' },
  { t: ['Phone: ', { p: 'PHONE', v: '(512) 555-0142' }], k: 'row' },
  { t: ['Email: ', { p: 'EMAIL', v: 'marcus@whitfieldcraft.com' }], k: 'row' },
  { t: '— — — — — — — — — — — — — — — — — — — — —', k: 'rule' },
  { t: ['Business name: ', { p: 'ORG', v: 'Whitfield Craft Studio LLC' }], k: 'row' },
  { t: 'Schedule C — Profit or Loss', k: 'h2' },
  { t: ['  Gross receipts ........... ', { keep: '$ 487,200' }], k: 'row' },
  { t: ['  Wages paid .............. ', { keep: '$ 198,400' }], k: 'row' },
  { t: ['  Contract labor .......... ', { keep: '$  42,150' }], k: 'row' },
  { t: ['  Equipment & supplies ..... ', { keep: '$  31,800' }], k: 'row' },
  { t: ['  R&D-eligible wages ........ ', { keep: '$ 124,200' }], k: 'row' },
]

function RLine({ line, li, redactedKeys }) {
  if (line.k === 'h') return <div className="rdoc-h">{line.t}</div>
  if (line.k === 'h2') return <div className="rdoc-h2">{line.t}</div>
  if (line.k === 'sub') return <div className="rdoc-sub">{line.t}</div>
  if (line.k === 'rule') return <div className="rdoc-rule">{line.t}</div>
  if (Array.isArray(line.t)) {
    return (
      <div className="rdoc-row">
        {line.t.map((seg, si) => {
          if (typeof seg === 'string') return <span key={si} className="rdoc-mute">{seg}</span>
          if (seg.keep) return <span key={si} className="rdoc-keep">{seg.keep}</span>
          const tokenId = `${li}-${si}`
          const isRedacted = redactedKeys.has(tokenId)
          return isRedacted
            ? <span key={si} className="rdoc-token-block">[ {seg.p} ]</span>
            : <span key={si} className="rdoc-token-text">{seg.v}</span>
        })}
      </div>
    )
  }
  return <div className="rdoc-row">{line.t}</div>
}

function Redactor() {
  const [phase, setPhase] = useState('scanning') // idle | scanning | done
  const [scanY, setScanY] = useState(0)
  const [redactedKeys, setRedactedKeys] = useState(new Set())
  const [tokensFound, setTokensFound] = useState([])
  const containerRef = useRef(null)

  const allTokens = useMemo(() => {
    const out = []
    REDACTOR_LINES.forEach((line, li) => {
      if (Array.isArray(line.t)) {
        line.t.forEach((seg, si) => {
          if (typeof seg === 'object' && seg.p) {
            out.push({ id: `${li}-${si}`, type: seg.p, value: seg.v })
          }
        })
      }
    })
    return out
  }, [])

  function startScan() {
    setPhase('scanning')
    setRedactedKeys(new Set())
    setTokensFound([])
    setScanY(0)
  }

  // eslint-disable-next-line no-unused-vars
  function reset() {
    setPhase('idle')
    setScanY(0)
    setRedactedKeys(new Set())
    setTokensFound([])
  }

  useEffect(() => {
    if (phase !== 'scanning') return
    const total = 2400
    const start = performance.now()
    let raf
    const tokenOrder = ['2-1', '3-1', '4-1', '5-1', '6-1', '7-1', '9-1']
    const step = (now) => {
      const t = Math.min((now - start) / total, 1)
      setScanY(t * 100)
      const revealCount = Math.floor(t * tokenOrder.length)
      const revealed = new Set(tokenOrder.slice(0, revealCount))
      setRedactedKeys(revealed)
      setTokensFound(allTokens.filter((tok) => revealed.has(tok.id)))
      if (t < 1) raf = requestAnimationFrame(step)
      else setPhase('done')
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase, allTokens])

  useEffect(() => {
    if (phase !== 'done') return
    const id = setTimeout(() => startScan(), 2500)
    return () => clearTimeout(id)
  }, [phase])

  return (
    <div className="redactor-shell">
      <div className="redactor-bar">
        <span className="redactor-badge">
          <span className="redactor-lock-dot" />
          <span>Local-only</span>
        </span>
        <span className="redactor-label">
          <span className="rdoc-mute">document</span>
          <b>1040.pdf</b>
          <span className="rdoc-mute">· 4 pages</span>
        </span>
        <button
          className="redactor-action"
          onClick={() => { if (phase !== 'scanning') startScan() }}
          disabled={phase === 'scanning'}
        >
          {phase === 'idle' && <>▸ Run redactor</>}
          {phase === 'scanning' && 'Scanning…'}
          {phase === 'done' && <>↺ Replay</>}
        </button>
      </div>

      <div ref={containerRef} className="redactor-frame">
        <div className="redactor-doc">
          {REDACTOR_LINES.map((line, li) => (
            <RLine key={li} line={line} li={li} redactedKeys={redactedKeys} />
          ))}
        </div>

        {phase === 'scanning' && (
          <>
            <div className="redactor-scan-glow" style={{ top: `${scanY}%` }} />
            <div className="redactor-scan-line" style={{ top: `${scanY}%` }} />
          </>
        )}

        {phase === 'idle' && (
          <div className="redactor-idle">
            <div className="redactor-idle-card">
              <div className="redactor-idle-eyebrow">Try it · zero data leaves your browser</div>
              <div className="redactor-idle-title">Watch your tax return get redacted live.</div>
              <button onClick={startScan} className="redactor-idle-btn">▸ Start redaction</button>
            </div>
          </div>
        )}
      </div>

      <div className="redactor-foot">
        <div className="redactor-foot-stats">
          <div>
            <div className="redactor-foot-num num">{tokensFound.length}</div>
            <div className="redactor-foot-lbl">PII tokens stripped</div>
          </div>
          <div className="redactor-foot-div" />
          <div>
            <div className="redactor-foot-num num">0 KB</div>
            <div className="redactor-foot-lbl">uploaded to our servers</div>
          </div>
          <div className="redactor-foot-div" />
          <div>
            <div className="redactor-foot-num num">4</div>
            <div className="redactor-foot-lbl">line items extracted</div>
          </div>
        </div>
        <div className="redactor-foot-chips">
          {tokensFound.length === 0 ? (
            <span className="rdoc-mute" style={{ fontSize: 12 }}>chips appear as items are redacted →</span>
          ) : (
            tokensFound.map((t, i) => (
              <span key={i} className="redactor-chip">
                <span className="redactor-chip-type">{t.type}</span>
                <span className="redactor-chip-dot">●●●</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Redactor
