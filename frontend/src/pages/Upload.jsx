import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DeadlineBanner from '../components/DeadlineBanner.jsx'
import PdfUpload from '../components/PdfUpload.jsx'
import TrustBlock from '../components/TrustBlock.jsx'

function Upload() {
  return (
    <main id="main" className="page fluz-style upload-page">
      <DeadlineBanner />
      <nav className="hero-nav" aria-label="Primary">
        <Link to="/" className="brand-mark">Tax Credit Finder</Link>
        <Link to="/quiz" className="text-link">Skip · answer 5 questions instead</Link>
      </nav>

      <motion.section
        className="upload-shell-wrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="upload-header">
          <p className="eyebrow">Privacy-first intake</p>
          <h1 className="section-headline">Upload last year&apos;s<br />tax return.</h1>
          <p className="section-sub">
            Your PDF is parsed in your browser. Names, SSN, EIN, addresses get
            redacted in your browser. Only de-identified line items reach our
            agents — privacy enforced by topology, not policy.
          </p>
        </header>

        <PdfUpload hint={null} />
        <TrustBlock />
      </motion.section>
    </main>
  )
}

export default Upload
