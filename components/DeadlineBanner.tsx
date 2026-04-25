"use client";

import { useEffect, useState } from "react";

const DEADLINE = process.env.NEXT_PUBLIC_DEADLINE_DATE || "2026-07-04T23:59:59-04:00";

export default function DeadlineBanner() {
  const [diff, setDiff] = useState(() => Date.parse(DEADLINE) - Date.now());

  useEffect(() => {
    const tick = () => setDiff(Date.parse(DEADLINE) - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <div className="bg-warning text-paper px-4 py-2 text-center text-sm sticky top-0 z-50">
      <strong>⏱ {days}d {hours}h {minutes}m {seconds}s</strong> until July 4,
      2026 — last day to retroactively claim R&amp;D credits for tax years
      2022–2024. After that, the money is permanently gone.
    </div>
  );
}
