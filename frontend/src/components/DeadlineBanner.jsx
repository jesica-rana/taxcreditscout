import { useEffect, useState } from 'react'

const DEADLINE = '2026-07-04T23:59:59-04:00'

function diffNow() {
  return Date.parse(DEADLINE) - Date.now()
}

function DeadlineBanner() {
  const [diff, setDiff] = useState(diffNow)

  useEffect(() => {
    const id = setInterval(() => setDiff(diffNow()), 1000)
    return () => clearInterval(id)
  }, [])

  if (diff <= 0) return null

  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)

  return (
    <div className="deadline-banner">
      <strong>
        {days}d {hours}h {minutes}m {seconds}s
      </strong>{' '}
      until July 4, 2026 - last day to retroactively claim R&amp;D credits for
      tax years 2022-2024. After that, the money is permanently gone.
    </div>
  )
}

export default DeadlineBanner
