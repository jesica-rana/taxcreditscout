const ITEMS = [
  'Money-back if we find less than $1,000',
  '7-day full refund · no questions asked',
  'Stripe checkout · 256-bit SSL',
  'Open-source — verify privacy claims',
  'Not tax advice · we never contact the IRS',
]

function TrustBlock() {
  return (
    <ul className="trust-block">
      {ITEMS.map((t) => (
        <li key={t}>
          <span className="trust-tick">✓</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default TrustBlock
