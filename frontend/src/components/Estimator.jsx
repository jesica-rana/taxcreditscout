import { useState, useMemo, useEffect, useRef, useCallback } from "react"
/* Instant Estimator — three controls that produce a live $ readout */

const STATES = ["CA","TX","NY","FL","IL","WA","MA","CO","GA","OR","other"];
const STATE_MULT = { CA: 1.6, NY: 1.5, MA: 1.45, TX: 1.2, IL: 1.25, WA: 1.15, CO: 1.1, GA: 1.05, OR: 1.05, FL: 1.0, other: 0.9 };
const STATE_NAMES = { CA: "California", TX: "Texas", NY: "New York", FL: "Florida", IL: "Illinois", WA: "Washington", MA: "Massachusetts", CO: "Colorado", GA: "Georgia", OR: "Oregon", other: "All other" };

function Estimator() {
  const [emp, setEmp] = useState(12);
  const [rdPct, setRdPct] = useState(35);
  const [state, setState] = useState("CA");
  const [hires, setHires] = useState(2);
  const [equipPurch, setEquipPurch] = useState(true);

  const calc = useMemo(() => {
    // R&D federal: 6% of payroll-as-R&D
    const payroll = emp * 80000;
    const fedRD = Math.round((payroll * (rdPct / 100)) * 0.06);
    const stateRD = Math.round(fedRD * (STATE_MULT[state] - 1));
    const wotc = hires * 4800;
    const sec179 = equipPurch ? Math.min(emp * 600, 8500) : 0;
    const health = emp <= 25 ? Math.round(emp * 1100) : 0;
    const items = [
      { label: "Federal R&D Credit", amt: fedRD, form: "Form 6765" },
      { label: `${STATE_NAMES[state]} R&D Bonus`, amt: stateRD, form: state === "other" ? "—" : "State return" },
      { label: "WOTC (new hires)", amt: wotc, form: "Form 5884" },
      { label: "Section 179 Equipment", amt: sec179, form: "Form 4562" },
      { label: "Small Employer Health", amt: health, form: "Form 8941" },
    ].filter((x) => x.amt > 0);
    const total = items.reduce((a, b) => a + b.amt, 0);
    return { items, total };
  }, [emp, rdPct, state, hires, equipPurch]);

  return (
    <div style={estStyles.shell}>
      <div style={estStyles.controls}>
        <Slider label="Employees" value={emp} min={1} max={100} setValue={setEmp} suffix="people" />
        <Slider label="% of payroll on R&D / dev" value={rdPct} min={0} max={100} setValue={setRdPct} suffix="%" />
        <Slider label="Hires from targeted groups" value={hires} min={0} max={20} setValue={setHires} suffix="hires" />

        <div style={estStyles.fieldRow}>
          <div style={estStyles.fieldLabel}>Primary state</div>
          <div style={estStyles.statePicker}>
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                style={{
                  ...estStyles.stateChip,
                  background: state === s ? "var(--ink)" : "var(--paper)",
                  color: state === s ? "var(--paper)" : "var(--ink)",
                  borderColor: state === s ? "var(--ink)" : "var(--line-2)",
                }}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <label style={estStyles.toggleRow}>
          <input
            type="checkbox"
            checked={equipPurch}
            onChange={(e) => setEquipPurch(e.target.checked)}
            style={{ display: "none" }}
          />
          <span
            style={{
              ...estStyles.toggleSwitch,
              background: equipPurch ? "var(--ink)" : "var(--line-2)",
            }}
          >
            <span
              style={{
                ...estStyles.toggleKnob,
                transform: equipPurch ? "translateX(18px)" : "translateX(0px)",
              }}
            />
          </span>
          <span style={estStyles.toggleLbl}>Bought equipment / vehicles &gt; $5K</span>
        </label>
      </div>

      <div style={estStyles.results}>
        <div style={estStyles.resultsKicker}>Live estimate · updates as you type</div>
        <AnimatedTotal value={calc.total} />
        <div style={estStyles.resultsRange}>
          range: <b>${Math.round(calc.total * 0.7).toLocaleString()}</b> – <b>${Math.round(calc.total * 1.3).toLocaleString()}</b>
        </div>

        <ul style={estStyles.breakdown}>
          {calc.items.map((it, i) => (
            <li key={i} style={estStyles.breakRow}>
              <span style={estStyles.breakName}>{it.label}</span>
              <span style={estStyles.breakForm}>{it.form}</span>
              <span style={estStyles.breakAmt}>${it.amt.toLocaleString()}</span>
            </li>
          ))}
        </ul>

          <div style={estStyles.cta}>
            <button style={estStyles.ctaBtn} onClick={() => window.__openCheckout?.()}>
              Lock in <span style={{textDecoration:"line-through",opacity:0.5,marginRight:6,fontFamily:"var(--num)"}}>$99</span><span style={{fontFamily:"var(--num)"}}>$10</span> audit <span style={estStyles.ctaArrow}>→</span>
            </button>
            <div style={estStyles.ctaSub}>Pay $10 · we email your full report within 24 hours.</div>
          </div>
      </div>
    </div>
  );
}

function AnimatedTotal({ value }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = display;
    const to = value;
    const dur = 360;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div style={estStyles.totalNum}>
      <span style={estStyles.totalDollar}>$</span>
      {display.toLocaleString()}
    </div>
  );
}

function Slider({ label, value, min, max, setValue, suffix }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={estStyles.fieldRow}>
      <div style={estStyles.sliderHead}>
        <div style={estStyles.fieldLabel}>{label}</div>
        <div style={estStyles.sliderVal}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{value}</span>
          <span style={{ color: "var(--mute)", marginLeft: 4, fontSize: 11 }}>{suffix}</span>
        </div>
      </div>
      <div style={estStyles.sliderTrack}>
        <div style={{ ...estStyles.sliderFill, width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          style={estStyles.sliderInput}
        />
        <div style={{ ...estStyles.sliderThumb, left: `calc(${pct}% - 9px)` }} />
      </div>
    </div>
  );
}

const estStyles = {
  shell: {
    border: "1px solid var(--line-2)",
    borderRadius: 14,
    background: "var(--paper-2)",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    color: "var(--paper)",
  },
  controls: {
    padding: 32,
    display: "flex", flexDirection: "column", gap: 26,
    borderRight: "1px solid var(--line)",
    background: "var(--paper-3)",
  },
  fieldRow: { display: "flex", flexDirection: "column", gap: 10 },
  fieldLabel: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.10em",
    color: "var(--mute)",
  },
  sliderHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  sliderVal: {
    fontFamily: "var(--num)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
  },
  sliderTrack: {
    position: "relative",
    height: 6,
    borderRadius: 99,
    background: "var(--line-2)",
  },
  sliderFill: {
    height: "100%",
    background: "var(--accent)",
    borderRadius: 99,
    transition: "width 0.18s ease",
  },
  sliderThumb: {
    position: "absolute",
    top: -6,
    width: 18, height: 18, borderRadius: 99,
    background: "var(--paper)",
    border: "2px solid var(--accent)",
    boxShadow: "0 2px 6px rgba(11,11,15,0.18)",
    pointerEvents: "none",
    transition: "left 0.18s ease",
  },
  sliderInput: {
    position: "absolute", inset: 0,
    width: "100%", height: 18, top: -6,
    margin: 0, padding: 0,
    opacity: 0, cursor: "pointer",
  },

  statePicker: { display: "flex", flexWrap: "wrap", gap: 6 },
  stateChip: {
    border: "1px solid var(--line-2)",
    borderRadius: 999,
    padding: "6px 12px",
    fontFamily: "var(--mono)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.12s ease, color 0.12s ease, border-color 0.12s ease",
    background: "transparent",
    color: "var(--paper)",
  },

  toggleRow: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" },
  toggleSwitch: {
    width: 38, height: 20, borderRadius: 99,
    position: "relative",
    transition: "background 0.18s ease",
    flex: "none",
    background: "var(--line-2)",
  },
  toggleKnob: {
    position: "absolute",
    top: 2, left: 2,
    width: 16, height: 16, borderRadius: 99,
    background: "var(--paper)",
    transition: "transform 0.18s ease",
  },
  toggleLbl: { fontSize: 14, color: "var(--paper)" },

  results: {
    padding: 32,
    display: "flex", flexDirection: "column",
    background: "linear-gradient(180deg, oklch(74% 0.14 155 / 0.05), transparent)",
  },
  resultsKicker: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.10em",
    color: "var(--mute)",
  },
  totalNum: {
    fontFamily: "var(--num)",
    fontSize: 92,
    fontWeight: 500,
    lineHeight: 1,
    color: "var(--accent)",
    letterSpacing: "-0.04em",
    fontVariantNumeric: "tabular-nums",
    margin: "12px 0 8px",
    display: "flex", alignItems: "baseline",
  },
  totalDollar: {
    fontSize: 40,
    color: "var(--accent)",
    marginRight: 6,
    fontWeight: 400,
  },
  resultsRange: {
    color: "var(--mute)", fontSize: 13, fontFamily: "var(--mono)",
  },
  breakdown: {
    listStyle: "none",
    padding: 0,
    margin: "28px 0 0",
    borderTop: "1px solid var(--line)",
  },
  breakRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid var(--line)",
    alignItems: "baseline",
  },
  breakName: { fontSize: 14 },
  breakForm: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: "var(--mute)",
    whiteSpace: "nowrap",
  },
  breakAmt: {
    fontFamily: "var(--num)",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    fontSize: 16,
    color: "var(--paper)",
    minWidth: 80,
    textAlign: "right",
  },
  cta: { marginTop: "auto", paddingTop: 24 },
  ctaBtn: {
    background: "var(--accent)", color: "var(--ink)",
    border: "none",
    padding: "14px 22px",
    borderRadius: 999,
    fontSize: 14, fontWeight: 500,
    fontFamily: "var(--sans)",
    cursor: "pointer",
    width: "100%",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaArrow: { transition: "transform 0.18s ease" },
  ctaSub: {
    fontSize: 12, color: "var(--mute)", marginTop: 10, textAlign: "center",
  },
};

export default Estimator
