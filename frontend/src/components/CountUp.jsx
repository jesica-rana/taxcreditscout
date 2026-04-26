import { useEffect, useRef, useState } from 'react'

function CountUp({ to = 0, duration = 1200, prefix = '$', suffix = '', className = '' }) {
  const [value, setValue] = useState(0)
  const startedAt = useRef(null)
  const target = Number(to) || 0

  useEffect(() => {
    let raf
    startedAt.current = null
    const tick = (t) => {
      if (startedAt.current == null) startedAt.current = t
      const elapsed = t - startedAt.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return (
    <span className={`mono ${className}`}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}

export default CountUp
