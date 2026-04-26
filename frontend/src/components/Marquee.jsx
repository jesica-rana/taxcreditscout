// Infinite horizontal-scrolling social proof. Pure CSS animation, doubled
// content for seamless loop. Pauses on hover so users can read.

const ITEMS = [
  { who: 'Sarah · Denver, CO', amount: '$11,400' },
  { who: 'Mike · Austin, TX', amount: '$22,400' },
  { who: 'Priya · NYC', amount: '$8,200' },
  { who: 'Tom · Los Angeles, CA', amount: '$14,800' },
  { who: 'Diana · Chicago, IL', amount: '$6,900' },
  { who: 'Carlos · Miami, FL', amount: '$18,200' },
  { who: 'Aisha · Seattle, WA', amount: '$9,400' },
  { who: 'Dan · Boston, MA', amount: '$26,800' },
]

function Marquee() {
  // Doubled for seamless loop
  const list = [...ITEMS, ...ITEMS]
  return (
    <div className="marquee" role="region" aria-label="Recent findings">
      <div className="marquee-track">
        {list.map((item, i) => (
          <div className="marquee-item" key={i}>
            <span className="marquee-dot" />
            <span className="marquee-who">{item.who}</span>
            <span className="marquee-arrow">→</span>
            <span className="marquee-amount mono">{item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Marquee
