import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { parsePdf, redactImage } from '../lib/pdf-parser.js'
import { redact } from '../lib/redactor.js'
import { runIntakeFromPdf } from '../lib/api.js'
import RedactionPreview from './RedactionPreview.jsx'

const STAGES = {
  idle: 'Drop your last tax return',
  parsing: 'Reading PDF in your browser…',
  redacting: 'Redacting names, SSN, EIN, addresses…',
  preview: 'Review what leaves your device',
  submitting: 'Running 4 agents…',
}

function PdfUpload({ hint = null, onStageChange }) {
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [stage, setStage] = useState('idle')
  const [error, setError] = useState(null)
  const [pages, setPages] = useState([])
  const [allTokens, setAllTokens] = useState([])
  const [reviewed, setReviewed] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    onStageChange?.(stage)
  }, [stage, onStageChange])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('That file is not a PDF.')
      return
    }
    setError(null)
    setStage('parsing')
    try {
      const parsed = await parsePdf(file)
      setStage('redacting')
      const prepared = []
      const aggregated = []
      for (const p of parsed.pages) {
        const r = redact(p.text)
        const overlaid = await redactImage(p.imageDataUrl, r.tokens, p.items, p.width, p.height)
        prepared.push({
          pageNumber: p.pageNumber,
          redactedText: r.redactedText,
          redactedImageDataUrl: overlaid,
          tokens: r.tokens,
        })
        aggregated.push(...r.tokens)
      }
      setPages(prepared)
      setAllTokens(aggregated)
      setStage('preview')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to parse PDF')
      setStage('idle')
    }
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer?.files?.[0]
      handleFile(file)
    },
    [handleFile]
  )

  const onPickFile = (e) => handleFile(e.target.files?.[0])

  const submit = useCallback(async () => {
    setStage('submitting')
    setError(null)
    try {
      const response = await runIntakeFromPdf({ pages, hint })
      // PII tokens stay client-side, keyed by session for later re-injection at PDF download
      try {
        sessionStorage.setItem(`pii:${response.session_id}`, JSON.stringify(allTokens))
      } catch {}
      sessionStorage.setItem('taxCreditReport', JSON.stringify(response))
      sessionStorage.setItem('taxCreditMode', response.mode)
      navigate('/preview')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to run pipeline')
      setStage('preview')
    }
  }, [pages, allTokens, hint, navigate])

  const reset = () => {
    setPages([])
    setAllTokens([])
    setReviewed(false)
    setStage('idle')
    setError(null)
  }

  if (stage === 'preview' || stage === 'submitting') {
    return (
      <RedactionPreview
        pages={pages}
        tokens={allTokens}
        reviewed={reviewed}
        setReviewed={setReviewed}
        onSubmit={submit}
        onReset={reset}
        submitting={stage === 'submitting'}
        error={error}
      />
    )
  }

  return (
    <div className="upload-shell">
      <motion.div
        className={`drop-zone ${dragOver ? 'drop-zone-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={onPickFile}
        />

        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="drop-content"
            >
              <div className="drop-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <h3>{STAGES.idle}</h3>
              <p>PDF parsed and redacted in your browser. Nothing leaves your device until you say so.</p>
              <button type="button" className="button primary" onClick={(e) => { e.stopPropagation(); fileInput.current?.click() }}>
                Choose file
              </button>
              <p className="drop-hint">or drag &amp; drop · max 10 pages</p>
            </motion.div>
          )}

          {(stage === 'parsing' || stage === 'redacting') && (
            <motion.div
              key={stage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drop-content"
            >
              <div className="drop-spinner" />
              <h3>{STAGES[stage]}</h3>
              <p className="mono">100% local · no network calls yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && <p className="upload-error">{error}</p>}

      <div className="privacy-marks" aria-hidden="true">
        <span><span className="dot" /> Parsed in browser</span>
        <span><span className="dot" /> Redacted before send</span>
        <span><span className="dot" /> SSN never leaves device</span>
      </div>
    </div>
  )
}

export default PdfUpload
