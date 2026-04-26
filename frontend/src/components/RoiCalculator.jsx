import { useState } from 'react'

function RoiCalculator() {
  const [credits, setCredits] = useState(14_200)
  const roi = Math.max(1, Math.round(credits / 99))
  const profitable = credits >= 99

  return (
    <section className="roi-calculator">
      <p className="eyebrow">Quick math</p>
      <h3 className="serif-display">If we find ${credits.toLocaleString()},<br />you make {roi}× back.</h3>
      <p className="roi-sub">
        Average finding: <strong className="mono">$14,200</strong> · Cost of audit: <strong className="mono">$99</strong>
      </p>
      <input
        type="range"
        min={99}
        max={50000}
        step={100}
        value={credits}
        onChange={(e) => setCredits(parseInt(e.target.value))}
        aria-label="Estimated credits found"
      />
      <div className="roi-scale mono">
        <span>$99</span>
        <span>$25k</span>
        <span>$50k</span>
      </div>
      <p className={`roi-verdict ${profitable ? 'roi-good' : ''}`}>
        {profitable ? '✓ Net positive at any value above $99' : 'Drag the slider to see your potential return'}
      </p>
    </section>
  )
}

export default RoiCalculator
