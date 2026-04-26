import { Link } from 'react-router-dom'

function StickyMobileCta() {
  return (
    <div className="sticky-mobile-cta" aria-hidden="false">
      <div>
        <p className="sticky-warn">⏱ 70 days left</p>
        <p className="sticky-meta">Avg finding · <strong className="mono">$14,200</strong></p>
      </div>
      <Link to="/upload" className="button primary">Find my credits</Link>
    </div>
  )
}

export default StickyMobileCta
