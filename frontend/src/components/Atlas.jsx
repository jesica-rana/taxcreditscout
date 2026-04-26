import { useState, useMemo, useEffect, useRef, useCallback } from "react"
/* Credit Atlas — interactive US tile-grid showing credits per state */

// US states laid out on an 11-col × 8-row tilegram (Bostock/NPR-style).
// Row 1: AK ............................................. ME
// Row 2: ........................................... VT NH
// Row 3: WA ID MT ND MN WI . MI . NY MA
// Row 4: OR NV WY SD IA IL IN OH PA NJ CT
// Row 5: CA UT CO NE MO KY WV VA MD DE RI
// Row 6: ... AZ NM KS AR TN NC SC DC
// Row 7: ............ OK LA MS AL GA
// Row 8: HI ................. TX ........ FL
const US_GRID = [
  // Row 1 — AK far NW, ME far NE
  { s: "AK", c: 1,  r: 1 },
  { s: "ME", c: 11, r: 1 },

  // Row 2 — VT, NH tucked into NE
  { s: "VT", c: 10, r: 2 },
  { s: "NH", c: 11, r: 2 },

  // Row 3 — Northern tier: WA→MA
  { s: "WA", c: 1,  r: 3 }, { s: "ID", c: 2, r: 3 }, { s: "MT", c: 3, r: 3 },
  { s: "ND", c: 4,  r: 3 }, { s: "MN", c: 5, r: 3 }, { s: "WI", c: 6, r: 3 },
  { s: "MI", c: 8,  r: 3 }, { s: "NY", c: 9, r: 3 }, { s: "MA", c: 10, r: 3 },

  // Row 4 — Mid-North: OR→CT
  { s: "OR", c: 1,  r: 4 }, { s: "NV", c: 2, r: 4 }, { s: "WY", c: 3, r: 4 },
  { s: "SD", c: 4,  r: 4 }, { s: "IA", c: 5, r: 4 }, { s: "IL", c: 6, r: 4 },
  { s: "IN", c: 7,  r: 4 }, { s: "OH", c: 8, r: 4 }, { s: "PA", c: 9, r: 4 },
  { s: "NJ", c: 10, r: 4 }, { s: "CT", c: 11, r: 4 },

  // Row 5 — Mid: CA→RI
  { s: "CA", c: 1,  r: 5 }, { s: "UT", c: 2, r: 5 }, { s: "CO", c: 3, r: 5 },
  { s: "NE", c: 4,  r: 5 }, { s: "MO", c: 5, r: 5 }, { s: "KY", c: 6, r: 5 },
  { s: "WV", c: 7,  r: 5 }, { s: "VA", c: 8, r: 5 }, { s: "MD", c: 9, r: 5 },
  { s: "DE", c: 10, r: 5 }, { s: "RI", c: 11, r: 5 },

  // Row 6 — South-mid: AZ→DC
  { s: "AZ", c: 2,  r: 6 }, { s: "NM", c: 3, r: 6 }, { s: "KS", c: 4, r: 6 },
  { s: "AR", c: 5,  r: 6 }, { s: "TN", c: 6, r: 6 }, { s: "NC", c: 7, r: 6 },
  { s: "SC", c: 8,  r: 6 }, { s: "DC", c: 9, r: 6 },

  // Row 7 — South: OK→GA
  { s: "OK", c: 4,  r: 7 }, { s: "LA", c: 5, r: 7 }, { s: "MS", c: 6, r: 7 },
  { s: "AL", c: 7,  r: 7 }, { s: "GA", c: 8, r: 7 },

  // Row 8 — Bottom: HI SW corner, TX center-S, FL SE
  { s: "HI", c: 1,  r: 8 },
  { s: "TX", c: 4,  r: 8 },
  { s: "FL", c: 9,  r: 8 },
];

// Synthetic credit counts per state (federal stack always = 47)
const STATE_DATA = {
  CA: { state: 18, local: 9, top: "California Research Credit", topAmt: "$18,000 avg" },
  NY: { state: 14, local: 11, top: "NY Investment Tax Credit", topAmt: "$12,000 avg" },
  TX: { state: 12, local: 6, top: "TX Franchise R&D Credit", topAmt: "$8,500 avg" },
  FL: { state: 9, local: 5, top: "FL Capital Investment Credit", topAmt: "$6,200 avg" },
  IL: { state: 11, local: 7, top: "IL EDGE Credit", topAmt: "$9,400 avg" },
  WA: { state: 8, local: 4, top: "WA High-Tech B&O Credit", topAmt: "$7,100 avg" },
  MA: { state: 13, local: 6, top: "MA Life Sciences Credit", topAmt: "$11,200 avg" },
  CO: { state: 9, local: 5, top: "CO Enterprise Zone Credit", topAmt: "$5,800 avg" },
  GA: { state: 10, local: 4, top: "GA Job Tax Credit", topAmt: "$8,000 avg" },
  NC: { state: 8, local: 3, top: "NC Article 3J Credit", topAmt: "$6,400 avg" },
  AZ: { state: 7, local: 3, top: "AZ R&D Credit", topAmt: "$7,500 avg" },
  PA: { state: 10, local: 5, top: "PA R&D Credit", topAmt: "$8,800 avg" },
  OH: { state: 9, local: 6, top: "OH JobsOhio Credit", topAmt: "$7,000 avg" },
  MI: { state: 8, local: 4, top: "MI MEGA Credit", topAmt: "$6,500 avg" },
  NJ: { state: 11, local: 6, top: "NJ Grow NJ Credit", topAmt: "$9,200 avg" },
  VA: { state: 9, local: 5, top: "VA Major Business Facility Credit", topAmt: "$7,400 avg" },
  OR: { state: 7, local: 4, top: "OR R&D Credit", topAmt: "$5,500 avg" },
  CT: { state: 8, local: 4, top: "CT R&D Credit", topAmt: "$6,000 avg" },
  MN: { state: 7, local: 3, top: "MN R&D Credit", topAmt: "$5,800 avg" },
  WI: { state: 6, local: 3, top: "WI R&D Credit", topAmt: "$5,200 avg" },
  IN: { state: 5, local: 2, top: "IN Hoosier Business Credit", topAmt: "$4,200 avg" },
  TN: { state: 5, local: 2, top: "TN Job Tax Credit", topAmt: "$4,800 avg" },
  MD: { state: 8, local: 4, top: "MD R&D Credit", topAmt: "$6,800 avg" },
  UT: { state: 6, local: 3, top: "UT Targeted Business Credit", topAmt: "$5,100 avg" },
};

const FED_COUNT = 47;

function intensityFor(s) {
  const d = STATE_DATA[s];
  if (!d) return 0;
  const total = d.state + d.local;
  return Math.min(1, total / 28);
}

function Atlas() {
  const [hover, setHover] = useState("CA");
  const data = STATE_DATA[hover] || { state: 4, local: 1, top: "Federal stack only", topAmt: "—" };
  const totalCreditCount = FED_COUNT + data.state + data.local;

  return (
    <div style={atlasStyles.grid2col}>
      <div style={atlasStyles.mapShell}>
        <div style={atlasStyles.mapHead}>
          <div>
            <div style={atlasStyles.mapKicker}>United States · 50 states + DC</div>
            <div style={atlasStyles.mapTitle}>Hover any state</div>
          </div>
          <div style={atlasStyles.legend}>
            <span style={atlasStyles.legendLbl}>fewer</span>
            {[0.20, 0.40, 0.60, 0.80, 1.0].map((v) => (
              <span
                key={v}
                style={{ ...atlasStyles.legendCell, background: `color-mix(in oklch, var(--accent) ${v * 100}%, var(--paper-3))` }}
              />
            ))}
            <span style={atlasStyles.legendLbl}>more</span>
          </div>
        </div>

        <div style={atlasStyles.mapBoard}>
          {US_GRID.map(({ s, c, r }) => {
            const i = intensityFor(s);
            const has = !!STATE_DATA[s];
            const active = hover === s;
            return (
              <button
                key={s}
                onMouseEnter={() => setHover(s)}
                onFocus={() => setHover(s)}
                style={{
                  ...atlasStyles.cell,
                  gridColumn: c,
                  gridRow: r,
                  background: has
                    ? `color-mix(in oklch, var(--accent) ${20 + i * 50}%, var(--paper-3))`
                    : "var(--paper-3)",
                  color: has ? "var(--paper)" : "var(--mute-2)",
                  borderColor: active ? "var(--accent)" : "transparent",
                  transform: active ? "scale(1.12)" : "scale(1)",
                  zIndex: active ? 3 : 1,
                  boxShadow: active ? "0 8px 22px -4px color-mix(in oklch, var(--accent) 50%, transparent)" : "none",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div style={atlasStyles.mapFoot}>
          <span style={atlasStyles.mapFootKey}>
            <span style={{ ...atlasStyles.legendCell, background: "var(--paper-3)" }} /> not yet indexed
          </span>
          <span style={atlasStyles.mapFootKey}>
            <span style={{ ...atlasStyles.legendCell, background: "var(--accent)" }} /> indexed
          </span>
        </div>
      </div>

      <div style={atlasStyles.detail}>
        <div style={atlasStyles.detailKicker}>Stacked credits in <b style={{ color: "var(--paper)", fontWeight: 600 }}>{hover}</b></div>
        <div style={atlasStyles.detailNum}>
          {totalCreditCount}
          <span style={atlasStyles.detailNumSm}>credits</span>
        </div>
        <div style={atlasStyles.detailBreak}>
          <Bar label="Federal" count={FED_COUNT} max={FED_COUNT + 28} color="var(--paper)" />
          <Bar label="State" count={data.state} max={FED_COUNT + 28} color="var(--accent)" />
          <Bar label="Local" count={data.local} max={FED_COUNT + 28} color="var(--money)" />
        </div>

        <div style={atlasStyles.divider} />

        <div style={atlasStyles.topPick}>
          <div style={atlasStyles.topPickLbl}>Highest-yield credit in {hover}</div>
          <div style={atlasStyles.topPickName}>{data.top}</div>
          <div style={atlasStyles.topPickAmt}>{data.topAmt}</div>
        </div>

        <div style={atlasStyles.cta}>
          <div style={atlasStyles.ctaText}>
            Most CPAs know <b style={{color:"var(--paper)", fontWeight: 600}}>5–6</b> federal credits.
            We index <b style={{color:"var(--accent)", fontWeight: 600}}>{totalCreditCount}</b> for businesses in {hover}.
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, count, max, color }) {
  const pct = (count / max) * 100;
  return (
    <div style={atlasStyles.barRow}>
      <span style={atlasStyles.barLbl}>{label}</span>
      <div style={atlasStyles.barTrack}>
        <div style={{ ...atlasStyles.barFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={atlasStyles.barNum}>{count}</span>
    </div>
  );
}

const atlasStyles = {
  grid2col: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 24,
    alignItems: "stretch",
  },
  mapShell: {
    border: "1px solid var(--line-2)",
    borderRadius: 14,
    background: "var(--paper-2)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
  mapHead: {
    display: "flex", justifyContent: "space-between", alignItems: "end",
    marginBottom: 24, gap: 16, flexWrap: "wrap",
  },
  mapKicker: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--mute-2)",
    marginBottom: 6,
  },
  mapTitle: { fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, color: "var(--paper)", letterSpacing: "-0.02em" },
  legend: { display: "flex", alignItems: "center", gap: 4 },
  legendLbl: { fontFamily: "var(--mono)", fontSize: 10, color: "var(--mute-2)", margin: "0 6px" },
  legendCell: {
    display: "inline-block",
    width: 14, height: 14, borderRadius: 3,
  },
  mapBoard: {
    position: "relative",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(11, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
    gap: 4,
    aspectRatio: "11 / 8",
  },
  cell: {
    width: "100%",
    height: "100%",
    border: "2px solid transparent",
    borderRadius: 4,
    fontFamily: "var(--mono)",
    fontSize: "clamp(8px, 1vw, 11px)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, background 0.2s ease",
    display: "grid", placeItems: "center",
    padding: 0,
  },
  mapFoot: {
    display: "flex", gap: 24,
    fontFamily: "var(--mono)", fontSize: 10,
    color: "var(--mute-2)",
    marginTop: 16,
    flexWrap: "wrap",
  },
  mapFootKey: { display: "inline-flex", alignItems: "center", gap: 8 },

  detail: {
    background: "var(--paper-2)",
    border: "1px solid var(--line-2)",
    borderRadius: 14,
    padding: 28,
    display: "flex", flexDirection: "column",
  },
  detailKicker: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "var(--mute)",
  },
  detailNum: {
    fontFamily: "var(--num)",
    fontSize: "clamp(56px, 8vw, 92px)",
    fontWeight: 500,
    lineHeight: 1,
    color: "var(--paper)",
    margin: "10px 0 24px",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.04em",
    display: "flex", alignItems: "baseline", gap: 14,
  },
  detailNumSm: {
    fontSize: 13,
    fontFamily: "var(--mono)",
    fontWeight: 400,
    color: "var(--mute)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  detailBreak: { display: "flex", flexDirection: "column", gap: 10 },

  barRow: { display: "grid", gridTemplateColumns: "76px 1fr 36px", alignItems: "center", gap: 14 },
  barLbl: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.06em" },
  barTrack: { height: 8, background: "var(--paper-3)", borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.32s ease" },
  barNum: { fontFamily: "var(--num)", fontSize: 13, color: "var(--paper)", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" },

  divider: { height: 1, background: "var(--line)", margin: "24px 0" },

  topPick: { },
  topPickLbl: {
    fontFamily: "var(--mono)", fontSize: 10,
    letterSpacing: "0.10em", textTransform: "uppercase",
    color: "var(--mute)", marginBottom: 8,
  },
  topPickName: {
    fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500,
    color: "var(--paper)", lineHeight: 1.25, letterSpacing: "-0.015em",
  },
  topPickAmt: {
    fontFamily: "var(--num)", fontSize: 13, color: "var(--accent)",
    marginTop: 6, fontWeight: 600, fontVariantNumeric: "tabular-nums",
  },

  cta: {
    marginTop: "auto",
    paddingTop: 24,
  },
  ctaText: {
    fontFamily: "var(--serif)",
    fontSize: 16,
    color: "var(--mute)",
    lineHeight: 1.5,
    letterSpacing: "-0.005em",
  },
};

export default Atlas
