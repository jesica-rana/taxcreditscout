import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { runIntake } from '../lib/api.js'
import DeadlineBanner from '../components/DeadlineBanner.jsx'

const AGENTS = [
  {
    id: 'profile',
    name: 'Profile Builder',
    traces: [
      'Parsing business description',
      'Inferring industry from signals',
      'Generating 8 derived search queries',
    ],
  },
  {
    id: 'retrieval',
    name: 'Vector Retrieval',
    traces: [
      'Embedding queries with text-embedding-3-small',
      'Searching credit corpus by cosine similarity',
      'Filtering by jurisdiction and company size',
    ],
  },
  {
    id: 'verifier',
    name: 'Eligibility Verifier',
    traces: [
      'Loading candidate credits',
      'Cross-checking each criterion',
      'Estimating dollar ranges per credit',
    ],
  },
  {
    id: 'composer',
    name: 'Report Composer',
    traces: [
      'Drafting business summary',
      'Sequencing action plan: week / month / quarter',
      'Composing CPA handoff paragraph',
    ],
  },
]

function Typewriter({ text, speed = 22 }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <span>{shown}</span>
}

function Loading() {
  const navigate = useNavigate()
  const [agentIdx, setAgentIdx] = useState(0)
  const [traceIdx, setTraceIdx] = useState(0)

  // Cycle through agents and traces while the request is in flight
  useEffect(() => {
    const traceTimer = setInterval(() => {
      setTraceIdx((t) => {
        const currentAgent = AGENTS[agentIdx]
        if (!currentAgent) return t
        if (t + 1 >= currentAgent.traces.length) {
          setAgentIdx((a) => Math.min(a + 1, AGENTS.length - 1))
          return 0
        }
        return t + 1
      })
    }, 900)
    return () => clearInterval(traceTimer)
  }, [agentIdx])

  // Run the pipeline (api.js handles backend + fallback transparently)
  useEffect(() => {
    let answers = {}
    try {
      answers = JSON.parse(sessionStorage.getItem('taxCreditAnswers') || '{}')
    } catch {}
    if (!answers.businessDescription) {
      navigate('/quiz')
      return
    }

    runIntake(answers)
      .then((response) => {
        sessionStorage.setItem('taxCreditReport', JSON.stringify(response))
        sessionStorage.setItem('taxCreditMode', response.mode)
        const delay = response.mode === 'live' ? 500 : 800
        setTimeout(() => navigate('/preview'), delay)
      })
      .catch((err) => {
        console.error('runIntake unexpected error', err)
        // api.js never throws — but just in case, route to results with empty state
        sessionStorage.removeItem('taxCreditReport')
        navigate('/results')
      })
  }, [navigate])

  return (
    <main id="main" className="page fluz-style agent-loader">
      <DeadlineBanner />
      <motion.section
        className="agent-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="eyebrow">Pipeline running</p>
        <h1 className="serif-display">4 agents in sequence</h1>

        <div className="agent-grid">
          {AGENTS.map((agent, i) => {
            const status = i < agentIdx ? 'done' : i === agentIdx ? 'active' : 'pending'
            return (
              <motion.div
                key={agent.id}
                className={`agent-card agent-${status}`}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: status === 'pending' ? 0.4 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="agent-head">
                  <span className="agent-num mono">0{i + 1}</span>
                  <span className="agent-name">{agent.name}</span>
                  <span className={`agent-dot agent-dot-${status}`} />
                </div>
                <div className="agent-trace mono">
                  <AnimatePresence mode="wait">
                    {status === 'active' && (
                      <motion.div
                        key={traceIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        <span className="trace-prefix">▸ </span>
                        <Typewriter text={agent.traces[traceIdx] || ''} />
                        <span className="cursor-blink">▍</span>
                      </motion.div>
                    )}
                    {status === 'done' && (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="trace-done"
                      >
                        ✓ Complete
                      </motion.div>
                    )}
                    {status === 'pending' && (
                      <motion.div key="pending" className="trace-pending">
                        Waiting…
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>
    </main>
  )
}

export default Loading
