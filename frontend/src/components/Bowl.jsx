import { useState, useEffect, useRef } from "react"
/* CreditBowl — animated bowl filling with credits like a Chipotle bowl */

const INGREDIENTS = [
  { id: 1, label: "R&D Credit",       form: "Form 6765", amt: 20160, w: 178, color: "var(--accent)",  weight: "tall" },
  { id: 2, label: "WOTC",              form: "Form 5884", amt:  3120, w: 132, color: "var(--money)",   weight: "short" },
  { id: 3, label: "Sec. 179",          form: "Form 4562", amt:  8400, w: 152, color: "var(--paper)",   weight: "mid" },
  { id: 4, label: "CA R&D Bonus",      form: "Sched. CA", amt: 12096, w: 178, color: "var(--accent)",  weight: "tall" },
  { id: 5, label: "Solar ITC",         form: "Form 3468", amt:  6480, w: 158, color: "var(--money)",   weight: "mid" },
  { id: 6, label: "Empl. Health",      form: "Form 8941", amt:  3300, w: 168, color: "var(--paper)",   weight: "short" },
  { id: 7, label: "EV Charging",       form: "Form 8911", amt:  2500, w: 162, color: "var(--accent)",  weight: "short" },
  { id: 8, label: "Apprenticeship",    form: "Local · TX",amt:  4200, w: 178, color: "var(--money)",   weight: "mid" },
];

// Bowl geometry (in svg viewBox coords)
const BOWL = {
  vbW: 600, vbH: 380,
  rimY: 130,
  rimL: 70, rimR: 530,
  centerX: 300,
  bottomY: 340,
  // "settle" target line for stacked items
  floorY: 320,
};

function CreditBowl() {
  const [items, setItems] = useState([]);  // {id, label, x, y, vy, settled, layer, ...}
  // eslint-disable-next-line no-unused-vars
  const [showAll, setShowAll] = useState(false);
  const [running, setRunning] = useState(false);  // start paused, observer enables
  const seqRef = useRef(0);
  const rafRef = useRef(0);
  const containerRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const lastDropRef = useRef(0);

  // total ticker — animated count-up
  const total = items.filter(i => i.settled).reduce((sum, i) => sum + i.amt, 0);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const start = displayTotal;
    const end = total;
    const dur = 600;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplayTotal(Math.round(start + (end - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  // intersection observer — only run when in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setRunning(e.isIntersecting)),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // drop new ingredient on a timer
  useEffect(() => {
    if (!running) return;
    const drop = () => {
      const idx = seqRef.current % INGREDIENTS.length;
      const seed = INGREDIENTS[idx];
      seqRef.current += 1;
      // randomize landing target column slightly
      const slot = (seqRef.current * 67) % 5;  // 0..4
      const targetX = BOWL.centerX - 160 + slot * 80 + (Math.random() * 30 - 15);
      setItems((prev) => {
        // remove fully-settled-and-old items if too many
        const trimmed = prev.length >= 12 ? prev.slice(prev.length - 11) : prev;
        return [
          ...trimmed,
          {
            uid: Math.random().toString(36).slice(2),
            ...seed,
            x: targetX,
            y: -50 - Math.random() * 60,
            vy: 0,
            rot: (Math.random() * 30 - 15),
            rotV: (Math.random() * 6 - 3),
            settled: false,
            settleTime: 0,
            tIdx: trimmed.length,
          },
        ];
      });
    };
    drop();
    const id = setInterval(drop, 1100);
    return () => clearInterval(id);
  }, [running]);

  // physics loop (throttled to ~30fps)
  useEffect(() => {
    if (!running) return;
    let lastT = 0;
    const tick = (t) => {
      if (t - lastT >= 33) {
        lastT = t;
        setItems((prev) => {
        if (!prev.length) return prev;
        // skip a tick if everything already settled (avoids react reconcile churn)
        const anyMoving = prev.some((it) => !it.settled);
        if (!anyMoving) return prev;
        // determine column-based stacking targets: count settled items in each "column" then stack
        // items group by rounded x position into 6 buckets
        const buckets = {};
        prev.forEach((it) => {
          if (!it.settled) return;
          const k = Math.round(it.x / 70);
          buckets[k] = (buckets[k] || 0) + 1;
        });
        return prev.map((it) => {
          if (it.settled) {
            return it;
          }
          const k = Math.round(it.x / 70);
          const stackCount = buckets[k] || 0;
          // each item is ~32px tall; stack y reduces by 26 per item
          const targetY = BOWL.floorY - 22 - stackCount * 26;
          let vy = it.vy + 0.65;  // gravity
          let y = it.y + vy;
          let rot = it.rot + it.rotV;
          let rotV = it.rotV * 0.96;
          let settled = false;
          if (y >= targetY) {
            y = targetY;
            // bounce
            if (Math.abs(vy) > 2.5) {
              vy = -vy * 0.42;
              rotV = rotV * 0.5;
            } else {
              vy = 0;
              rotV = 0;
              rot = rot * 0.7;
              settled = true;
            }
          }
          // bowl walls — keep items inside as they fall/stack
          // bowl is approximately a semicircle; the inner wall at depth d narrows
          // simple: at y=floorY, allowed x range is ~[140, 460]; at y=rimY, ~[BOWL.rimL, BOWL.rimR]
          const t = Math.min(1, Math.max(0, (y - BOWL.rimY) / (BOWL.floorY - BOWL.rimY)));
          const innerHalfW = 230 - t * 60;
          const minX = BOWL.centerX - innerHalfW;
          const maxX = BOWL.centerX + innerHalfW;
          let x = it.x;
          if (x < minX) x = minX;
          if (x > maxX) x = maxX;
          return {
            ...it, x, y, vy, rot, rotV, settled,
            settleTime: settled && !it.settled ? performance.now() : it.settleTime,
            freshness: settled ? 1 : 0,
          };
        });
      });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const settledCount = items.filter(i => i.settled).length;

  return (
    <div ref={containerRef} style={bowlStyles.shell}>
      {/* Left text */}
      <div style={bowlStyles.copy}>
        <div style={bowlStyles.kicker}>The CreditBowl</div>
        <div style={bowlStyles.title}>
          Every credit you qualify for, <span style={{color:"var(--accent)"}}>scooped into one bowl.</span>
        </div>
        <div style={bowlStyles.body}>
          Federal, state, and local credits drop in as we match them.
          One report. One $10 audit. Emailed to your inbox within 24 hours.
        </div>

        <div style={bowlStyles.statRow}>
          <div style={bowlStyles.stat}>
            <div style={bowlStyles.statNum}>{settledCount}</div>
            <div style={bowlStyles.statLbl}>credits in bowl</div>
          </div>
          <div style={bowlStyles.statDivider} />
          <div style={bowlStyles.stat}>
            <div style={{...bowlStyles.statNum, color: "var(--money)"}}>${displayTotal.toLocaleString()}</div>
            <div style={bowlStyles.statLbl}>stacked so far</div>
          </div>
        </div>

        <button style={{...bowlStyles.cta, display: "none"}} onClick={() => {
          setItems([]);
          seqRef.current = 0;
        }}>
          <span>Empty &amp; re-fill</span>
          <span style={{opacity:0.5}}>↺</span>
        </button>
      </div>

      {/* Right bowl visualization */}
      <div style={bowlStyles.bowlWrap}>
        <svg viewBox={`0 0 ${BOWL.vbW} ${BOWL.vbH}`} style={bowlStyles.svg}>
          <defs>
            <clipPath id="bowl-inside-clip">
              {/* inside-of-bowl clip = the bowl shape minus the rim ellipse top half */}
              <path d={`
                M ${BOWL.rimL} ${BOWL.rimY}
                Q ${BOWL.rimL} ${BOWL.bottomY} ${BOWL.centerX} ${BOWL.bottomY}
                Q ${BOWL.rimR} ${BOWL.bottomY} ${BOWL.rimR} ${BOWL.rimY}
                Z
              `} />
            </clipPath>
            <linearGradient id="bowl-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--paper-3)" />
              <stop offset="1" stopColor="var(--paper-2)" />
            </linearGradient>
          </defs>

          {/* bowl back rim (behind ingredients) */}
          <ellipse cx={BOWL.centerX} cy={BOWL.rimY} rx={(BOWL.rimR-BOWL.rimL)/2} ry="22"
                   fill="var(--ink-2)" stroke="var(--line-2)" strokeWidth="1.5" />

          {/* faint accent wash at bottom of bowl interior */}
          <ellipse cx={BOWL.centerX} cy={BOWL.bottomY} rx="180" ry="18"
                   fill="var(--accent)" opacity="0.06" />

          {/* ingredients clipped to bowl interior */}
          <g clipPath="url(#bowl-inside-clip)">
            {/* shadow inside bowl */}
            <ellipse cx={BOWL.centerX} cy={BOWL.bottomY - 6} rx="200" ry="20"
                     fill="rgba(0,0,0,0.35)" />
            {items.map((it) => (
              <Ingredient key={it.uid} item={it} />
            ))}
          </g>

          {/* bowl front rim (over ingredients) */}
          <path d={`
            M ${BOWL.rimL} ${BOWL.rimY}
            Q ${BOWL.rimL} ${BOWL.bottomY + 4} ${BOWL.centerX} ${BOWL.bottomY + 4}
            Q ${BOWL.rimR} ${BOWL.bottomY + 4} ${BOWL.rimR} ${BOWL.rimY}
          `} fill="none" stroke="var(--paper)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

          {/* rim front highlight (the upper edge ellipse, front half only) */}
          <path
            d={`M ${BOWL.rimL} ${BOWL.rimY} A ${(BOWL.rimR-BOWL.rimL)/2} 22 0 0 0 ${BOWL.rimR} ${BOWL.rimY}`}
            fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.7"
          />

          {/* steam wisps — rising $ symbols (hot money) */}
          <DollarSteam x={BOWL.centerX - 56} delay={0} />
          <DollarSteam x={BOWL.centerX - 18} delay={0.5} />
          <DollarSteam x={BOWL.centerX + 22} delay={1.0} />
          <DollarSteam x={BOWL.centerX + 60} delay={1.6} />
        </svg>
      </div>
    </div>
  );
}

function Ingredient({ item }) {
  const w = item.w;
  const h = 30;
  // ingredient = rounded rect with credit name + $amt
  return (
    <g transform={`translate(${item.x - w/2}, ${item.y - h/2}) rotate(${item.rot} ${w/2} ${h/2})`}>
      <rect
        x="0" y="0" width={w} height={h} rx="6"
        fill={item.color}
        stroke={item.color === "var(--paper)" ? "var(--line-2)" : "rgba(0,0,0,0.2)"}
        strokeWidth="1"
      />
      {/* slim accent strip on left */}
      <rect x="0" y="0" width="4" height={h} fill="rgba(0,0,0,0.15)" />
      <text
        x="14" y={h/2 + 4}
        fontFamily="var(--sans), sans-serif"
        fontSize="12"
        fontWeight="600"
        fill={item.color === "var(--paper)" ? "var(--ink)" : "var(--ink)"}
      >{item.label}</text>
      <text
        x={w - 12} y={h/2 + 4}
        textAnchor="end"
        fontFamily="var(--mono), monospace"
        fontSize="11"
        fontWeight="600"
        fill={item.color === "var(--paper)" ? "var(--ink)" : "var(--ink)"}
        opacity="0.85"
      >${item.amt.toLocaleString()}</text>
    </g>
  );
}

function DollarSteam({ x, delay }) {
  // rising "$" symbol that fades in/out — bowl is hot AND money
  return (
    <g>
      <text
        x={x} y={BOWL.rimY - 6}
        textAnchor="middle"
        fontFamily="var(--num), monospace"
        fontSize="18"
        fontWeight="700"
        fill="var(--money)"
        opacity="0"
      >
        $
        <animate attributeName="opacity" values="0;0.85;0" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="y" values={`${BOWL.rimY - 6};${BOWL.rimY - 70}`} dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="font-size" values="14;22" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
      </text>
    </g>
  );
}

// eslint-disable-next-line no-unused-vars
function SteamWisp({ x, delay }) {
  return (
    <g style={{ transformOrigin: `${x}px ${BOWL.rimY - 10}px` }}>
      <ellipse cx={x} cy={BOWL.rimY - 4} rx="6" ry="3"
               fill="var(--paper)" opacity="0.0">
        <animate attributeName="opacity" values="0;0.35;0" dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="cy" values={`${BOWL.rimY-4};${BOWL.rimY-50}`} dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="rx" values="3;14" dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

const bowlStyles = {
  shell: {
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr",
    gap: 32,
    alignItems: "stretch",
  },
  copy: {
    paddingTop: 24,
    display: "flex",
    flexDirection: "column",
  },
  kicker: {
    fontFamily: "var(--mono)", fontSize: 11,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: "var(--accent)",
    marginBottom: 18,
  },
  title: {
    fontFamily: "var(--serif)",
    fontSize: "clamp(32px, 4vw, 44px)",
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    color: "var(--paper)",
    textWrap: "balance",
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "var(--mute)",
    maxWidth: 480,
    marginBottom: 28,
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginBottom: 28,
    padding: "16px 0",
    borderTop: "1px solid var(--line)",
    borderBottom: "1px solid var(--line)",
  },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statNum: {
    fontFamily: "var(--num)",
    fontSize: 28, fontWeight: 500,
    color: "var(--paper)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  statLbl: {
    fontFamily: "var(--mono)", fontSize: 10,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "var(--mute)",
  },
  statDivider: {
    width: 1, height: 36, background: "var(--line)",
  },
  cta: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    color: "var(--paper)",
    border: "1px solid var(--line-2)",
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "var(--mono)",
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    transition: "border-color 0.15s ease, color 0.15s ease",
  },

  bowlWrap: {
    position: "relative",
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
    overflow: "hidden",
    minHeight: 420,
    display: "flex",
    flexDirection: "column",
  },
  svg: {
    width: "100%",
    height: "auto",
    flex: 1,
  },
  bowlCaption: {
    position: "absolute",
    top: 16, left: 16,
    fontFamily: "var(--mono)", fontSize: 10,
    letterSpacing: "0.10em", textTransform: "uppercase",
    color: "var(--mute)",
    display: "flex", alignItems: "center", gap: 8,
  },
  captionDot: {
    width: 6, height: 6, borderRadius: 99,
    background: "var(--money)",
    boxShadow: "0 0 0 4px rgba(15,123,63,0.18)",
    animation: "pulse 1.6s infinite",
  },
};

export default CreditBowl
