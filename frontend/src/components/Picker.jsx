import { useState, useMemo } from "react"
/* Activity Picker — visual chips that light up matching credits */

const ACTIVITIES = [
  { key: "hire", label: "Hired in last 12 months", icon: "↗" },
  { key: "equip", label: "Bought equipment > $5K", icon: "▤" },
  { key: "build", label: "Built or improved software", icon: "</>" },
  { key: "energy", label: "Solar / EV / efficient HVAC", icon: "◊" },
  { key: "health", label: "Paid employee health ins.", icon: "+" },
  { key: "leave", label: "Paid family/medical leave", icon: "✦" },
  { key: "vets", label: "Hired vets / disadvantaged", icon: "★" },
  { key: "oz", label: "In opportunity / enterprise zone", icon: "◎" },
  { key: "401k", label: "Started 401(k) or SEP plan", icon: "$" },
];

const CREDITS = [
  { id: "wotc", name: "Work Opportunity Tax Credit", amt: "$2,400 – $9,600", form: "Form 5884", deps: ["hire", "vets"] },
  { id: "rd", name: "Federal R&D Credit (Section 41)", amt: "up to $250,000", form: "Form 6765", deps: ["build"], deadline: true },
  { id: "179", name: "Section 179 Equipment Deduction", amt: "up to $1,160,000", form: "Form 4562", deps: ["equip"] },
  { id: "energy", name: "Energy Investment Tax Credit", amt: "30% of cost", form: "Form 3468", deps: ["energy"] },
  { id: "shop", name: "Small Employer Health Credit", amt: "up to 50% premiums", form: "Form 8941", deps: ["health"] },
  { id: "leave", name: "Paid Family Leave Credit (45S)", amt: "12.5–25% wages", form: "Form 8994", deps: ["leave"] },
  { id: "8881", name: "Pension Plan Startup Credit", amt: "up to $5,000/yr", form: "Form 8881", deps: ["401k"] },
  { id: "oz", name: "Opportunity Zone Investment", amt: "deferral + 0% gains", form: "Form 8997", deps: ["oz"] },
];

function Picker() {
  const [picked, setPicked] = useState(new Set(["hire", "build"]));

  function toggle(k) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }

  const matched = useMemo(() => {
    return CREDITS.map((c) => {
      const hits = c.deps.filter((d) => picked.has(d)).length;
      return { ...c, matched: hits > 0, strength: hits / c.deps.length };
    });
  }, [picked]);

  const matchCount = matched.filter((c) => c.matched).length;

  return (
    <div style={pickStyles.shell}>
      <div style={pickStyles.left}>
        <div style={pickStyles.sectionLbl}>1 · Tap what applies to your business</div>
        <div style={pickStyles.chipGrid}>
          {ACTIVITIES.map((a) => {
            const on = picked.has(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggle(a.key)}
                style={{
                  ...pickStyles.chip,
                  background: on ? "var(--accent)" : "transparent",
                  color: on ? "var(--ink)" : "var(--paper)",
                  borderColor: on ? "var(--accent)" : "var(--line-2)",
                }}
              >
                <span style={{ ...pickStyles.chipIcon, color: on ? "var(--accent)" : "var(--mute)" }}>{a.icon}</span>
                <span style={pickStyles.chipLbl}>{a.label}</span>
                <span
                  style={{
                    ...pickStyles.chipCheck,
                    background: on ? "var(--accent)" : "transparent",
                    borderColor: on ? "var(--accent)" : "var(--line-2)",
                  }}
                >{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <div style={pickStyles.helper}>
          {picked.size === 0
            ? "Select 1+ activities to see which credits light up →"
            : `${picked.size} selected · ${matchCount} credits matched`}
        </div>
      </div>

      <div style={pickStyles.right}>
        <div style={pickStyles.sectionLbl}>2 · Live matches</div>
        <ul style={pickStyles.creditList}>
          {matched.map((c) => (
            <li
              key={c.id}
              style={{
                ...pickStyles.creditRow,
                opacity: c.matched ? 1 : 0.32,
                borderColor: c.matched ? "var(--accent)" : "var(--line)",
                background: c.matched ? "var(--accent-tint)" : "transparent",
              }}
            >
              <div
                style={{
                  ...pickStyles.creditDot,
                  background: c.matched ? "var(--money)" : "var(--line-2)",
                  boxShadow: c.matched ? "0 0 0 4px rgba(15,123,63,0.15)" : "none",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={pickStyles.creditName}>{c.name}</div>
                <div style={pickStyles.creditMeta}>
                  <span style={{ whiteSpace: "nowrap" }}>{c.form}</span>
                  {c.deadline && c.matched && (
                    <span style={pickStyles.deadlinePill}>Deadline: Jul 4</span>
                  )}
                </div>
              </div>
              <div style={pickStyles.creditAmt}>{c.amt}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const pickStyles = {
  shell: {
    border: "1px solid var(--line-2)",
    borderRadius: 14,
    background: "var(--paper-2)",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    color: "var(--paper)",
  },
  left: { padding: 32, background: "var(--paper-3)", borderRight: "1px solid var(--line)" },
  right: { padding: 32 },
  sectionLbl: {
    fontFamily: "var(--mono)", fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.10em",
    color: "var(--mute)", marginBottom: 18,
  },
  chipGrid: { display: "flex", flexDirection: "column", gap: 8 },
  chip: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid var(--line-2)",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
    fontFamily: "var(--sans)",
    fontSize: 14,
    textAlign: "left",
    background: "transparent",
    color: "var(--paper)",
  },
  chipIcon: {
    fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600,
    width: 22, textAlign: "center",
    transition: "color 0.15s ease",
  },
  chipLbl: { flex: 1 },
  chipCheck: {
    width: 18, height: 18, borderRadius: 99,
    border: "1px solid",
    display: "grid", placeItems: "center",
    fontSize: 11, fontWeight: 600, color: "var(--paper)",
    transition: "background 0.15s ease",
  },
  helper: {
    marginTop: 18,
    fontFamily: "var(--mono)", fontSize: 12,
    color: "var(--mute)",
  },
  creditList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  creditRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 16px",
    border: "1px solid",
    borderRadius: 8,
    transition: "opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease",
    color: "var(--paper)",
  },
  creditDot: { width: 8, height: 8, borderRadius: 99, transition: "all 0.2s ease", flex: "none" },
  creditName: { fontWeight: 500, fontSize: 14 },
  creditMeta: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--mute)", marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  creditAmt: { fontFamily: "var(--num)", fontSize: 14, fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
  deadlinePill: {
    background: "var(--warn)", color: "var(--paper)",
    fontFamily: "var(--mono)", fontSize: 9,
    padding: "2px 6px", borderRadius: 4,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
};

export default Picker
