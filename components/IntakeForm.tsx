"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const ACTIVITIES = [
  { key: "hired_recently", label: "Hired in the last 12 months" },
  { key: "bought_equipment", label: "Bought equipment, machinery, or vehicles >$5K" },
  { key: "built_software", label: "Built or improved software, products, or processes" },
  { key: "renewable_energy", label: "Installed solar, EV chargers, or energy-efficient HVAC" },
  { key: "employee_health", label: "Paid for employee health insurance" },
  { key: "paid_leave", label: "Provided paid family or medical leave" },
  { key: "hired_disadvantaged", label: "Hired veterans, ex-felons, or workers from disadvantaged groups" },
  { key: "in_oz", label: "Located in an opportunity zone or enterprise zone" },
  { key: "started_retirement", label: "Started a new 401(k) or SEP retirement plan" },
];

const REVENUE_BANDS = [
  { value: "under_500k", label: "Under $500K" },
  { value: "500k_2m", label: "$500K – $2M" },
  { value: "2m_10m", label: "$2M – $10M" },
  { value: "10m_50m", label: "$10M – $50M" },
  { value: "over_50m", label: "Over $50M" },
] as const;

export default function IntakeForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [businessDescription, setBusinessDescription] = useState("");
  const [state, setState] = useState("CA");
  const [city, setCity] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number>(5);
  const [revenueBand, setRevenueBand] = useState<typeof REVENUE_BANDS[number]["value"]>("500k_2m");
  const [activities, setActivities] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [email, setEmail] = useState("");

  const toggle = (key: string) =>
    setActivities((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStage("Analyzing your business...");
    try {
      const stages = [
        "Analyzing your business...",
        "Searching 300+ tax credits...",
        "Verifying eligibility...",
        "Composing your report...",
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = Math.min(i + 1, stages.length - 1);
        setStage(stages[i]);
      }, 7000);

      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_description: businessDescription,
          state,
          city: city || null,
          employee_count: employeeCount,
          revenue_band: revenueBand,
          activities,
          free_text: freeText || null,
          email: email || null,
        }),
      });

      clearInterval(interval);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      const data = await res.json();
      router.push(`/results/${data.session_id}`);
    } catch (err: any) {
      setError(err.message || "Failed");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-12 h-12 border-4 border-ink/20 border-t-accent rounded-full animate-spin" />
        <p className="mt-6 text-lg text-ink/80">{stage}</p>
        <p className="mt-2 text-sm text-ink/50">This takes about 30 seconds.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <Field label="What does your business do?" hint="One or two sentences. Plain English.">
        <textarea
          required
          minLength={5}
          maxLength={500}
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder="e.g., We run a 12-person digital marketing agency in Austin. We build websites and run paid ads."
          className="w-full p-3 border border-ink/20 rounded-md bg-white"
          rows={3}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="State">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full p-3 border border-ink/20 rounded-md bg-white"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="City (optional)">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-3 border border-ink/20 rounded-md bg-white"
            placeholder="Austin"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Number of employees">
          <input
            type="number"
            min={0}
            max={100000}
            value={employeeCount}
            onChange={(e) => setEmployeeCount(parseInt(e.target.value || "0"))}
            className="w-full p-3 border border-ink/20 rounded-md bg-white"
          />
        </Field>
        <Field label="Annual revenue">
          <select
            value={revenueBand}
            onChange={(e) => setRevenueBand(e.target.value as any)}
            className="w-full p-3 border border-ink/20 rounded-md bg-white"
          >
            {REVENUE_BANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="In the last 12 months, did you do any of these?" hint="Check all that apply.">
        <div className="space-y-2">
          {ACTIVITIES.map((a) => (
            <label key={a.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activities.includes(a.key)}
                onChange={() => toggle(a.key)}
                className="mt-1"
              />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Anything else we should know?" hint="Optional. Helps us find more credits.">
        <textarea
          maxLength={500}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="e.g., we operate on tribal land, our facility had fire damage, we hired 2 vets..."
          className="w-full p-3 border border-ink/20 rounded-md bg-white"
          rows={2}
        />
      </Field>

      <Field label="Email (we'll send your full report)">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          className="w-full p-3 border border-ink/20 rounded-md bg-white"
        />
      </Field>

      {error && (
        <div className="p-3 bg-warning/10 border border-warning rounded-md text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-ink text-paper px-6 py-4 text-lg font-semibold rounded-md hover:bg-ink/90 transition"
      >
        Find my credits
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-sm text-ink/50 mb-2">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
