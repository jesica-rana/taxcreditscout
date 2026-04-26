/**
 * Generate state R&D tax credit records.
 *
 * No public agency publishes a comprehensive structured dataset of all 50
 * states' R&D credits — BDO/KBKG/Strike Tax/Moss Adams each publish a
 * directory of per-state pages, not a single CSV. Until eCFR-style state
 * regulation APIs exist (they don't), we enrich a hardcoded state list
 * using Claude's knowledge, then verify spot-check accuracy after.
 *
 * Skips CA and TX (already hand-curated in data/seed/sample-credits.json).
 *
 * Pipeline:
 *   1. For each state in STATES, call Claude with a focused prompt
 *   2. Output one Credit record per state to data/credits-state-rd.json
 *
 * Usage:
 *   npm run ingest:state-rd
 *   npm run ingest:state-rd -- --model=claude-opus-4-7   # max quality
 *   npm run ingest:state-rd -- --states=NY,IL,MA         # subset
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod/v4";
import { jsonCompletion, withRetry } from "../lib/openai";
import type { Credit } from "../lib/types";

const DEFAULT_OUTPUT = path.resolve("data/credits-state-rd.json");
const DEFAULT_ENRICH_MODEL = "claude-sonnet-4-6";

// 37 states with active R&D credits as of late 2025.
// CA and TX are excluded — they are hand-curated in the seed file.
// Source: BDO, KBKG, Moss Adams, Strike Tax state directories (verified 2025).
const STATES: { code: string; name: string }[] = [
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "NE", name: "Nebraska" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
];

const StateCreditSchema = z.object({
  has_active_credit: z
    .boolean()
    .describe("Set false if the state R&D credit is expired/repealed/inactive in 2025"),
  name: z.string().describe("e.g. 'Massachusetts Research Credit'"),
  credit_rate_pct: z
    .number()
    .describe("Headline credit rate as a percentage of qualified research expenses, e.g. 10 for 10%"),
  credit_amount_min: z.number().describe("Typical small-business minimum claim USD"),
  credit_amount_max: z.number().describe("Typical small-business maximum claim USD"),
  industries: z.array(z.string()),
  company_size_min_employees: z.number().int(),
  company_size_max_employees: z.number().int().nullable(),
  revenue_min: z.number().nullable(),
  revenue_max: z.number().nullable(),
  form: z.string().describe("State form name/number, e.g. 'Schedule RC' or 'Form CT-1120 RDC'"),
  filing_deadline: z.string(),
  refundable: z.boolean(),
  carryforward_years: z
    .number()
    .int()
    .nullable()
    .describe("Years unused credit may be carried forward; null if unlimited"),
  eligibility_text: z
    .string()
    .describe(
      "300-500 words. State the credit rate, qualifying expenses, conformity to federal §41, refundability/transferability, carryforward, any state-specific tests. Cite the state revenue dept and statute. If uncertain about a number, say 'see [State] DOR for current rate'."
    ),
  documentation_required: z.array(z.string()),
  url: z.string().describe("Best canonical state DOR or tax department URL"),
  estimated_avg_finding: z.number(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (k: string) =>
    args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];

  const outPath = arg("out") ? path.resolve(arg("out")!) : DEFAULT_OUTPUT;
  const model = arg("model") ?? DEFAULT_ENRICH_MODEL;
  const stateCodes = arg("states")?.split(",").map((s) => s.trim().toUpperCase());
  const states = stateCodes
    ? STATES.filter((s) => stateCodes.includes(s.code))
    : STATES;

  console.log(`Output: ${outPath}`);
  console.log(`Model:  ${model}`);
  console.log(`States: ${states.length}\n`);

  const enriched: Credit[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < states.length; i += 4) {
    const batch = states.slice(i, i + 4);
    const results = await Promise.all(
      batch.map((s) =>
        withRetry(() =>
          jsonCompletion({
            system: `You are a state-tax research assistant. Produce one structured Credit record for the named state's research and development tax credit, using your knowledge of state revenue departments and tax statutes as of 2025.

Field guidelines:
- has_active_credit: false ONLY if you know the state's R&D credit was repealed or sunset and is not available for 2025 returns
- name: official state credit name (e.g., "Massachusetts Research Credit", not "Massachusetts R&D Tax Credit")
- credit_rate_pct: the headline percentage of QREs (e.g., 10 for Massachusetts, 7.5 for Connecticut). Use the most common rate; note tiered rates in eligibility_text.
- credit_amount_min/max: realistic small-business range in USD
- industries: ["all"] unless the state restricts to specific sectors
- company_size_min/max: only set max if statute caps eligibility (rare)
- revenue_min/max: usually null
- form: state form name/number (e.g., "Schedule RC", "Form 306", "Schedule RD")
- filing_deadline: short text like "with state corporate return"
- refundable: true if cash-refundable (rare — examples: Iowa, Louisiana for some filers); false for most
- carryforward_years: typical state R&D credits are 10-20 years; null if unlimited
- eligibility_text: 300-500 words. State the rate, base period methodology, federal §41 conformity, refundability/transferability, carryforward, any state-specific tests (e.g., must use state-located activities). Cite the state's department of revenue. If you are unsure about a specific number or rule, say "see [State] Department of Revenue for current rate" rather than inventing.
- documentation_required: state and federal records needed
- url: best canonical state DOR or tax department URL for the credit (e.g., for MA: https://www.mass.gov/info-details/research-credit)
- estimated_avg_finding: conservative mid-range USD estimate of typical SMB claim`,
            user: `State: ${s.name} (${s.code})\n\nProduce the structured record for this state's R&D credit.`,
            schema: StateCreditSchema,
            model,
          })
        )
      )
    );
    for (let j = 0; j < batch.length; j++) {
      const s = batch[j];
      const r = results[j];
      if (!r.has_active_credit) {
        skipped.push(`${s.code} (no active credit)`);
        continue;
      }
      enriched.push({
        id: slugify(r.name) + "_" + s.code.toLowerCase(),
        name: r.name,
        jurisdiction: "State",
        state: s.code,
        city: null,
        credit_amount_min: r.credit_amount_min,
        credit_amount_max: r.credit_amount_max,
        credit_type: "percent_of_expense",
        industries: r.industries,
        company_size_min_employees: r.company_size_min_employees,
        company_size_max_employees: r.company_size_max_employees,
        revenue_min: r.revenue_min,
        revenue_max: r.revenue_max,
        form: r.form,
        filing_deadline: r.filing_deadline,
        deadline_critical: false,
        deadline_date: null,
        eligibility_text: r.eligibility_text,
        documentation_required: r.documentation_required,
        url: r.url,
        estimated_avg_finding: r.estimated_avg_finding,
        source_authority: `${s.code.toLowerCase()} state dor`,
      });
    }
    console.log(`  enriched: ${Math.min(i + 4, states.length)}/${states.length}`);
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✓ Wrote ${enriched.length} state R&D credits to ${outPath}`);
  if (skipped.length > 0) {
    console.log(`  Skipped: ${skipped.join(", ")}`);
  }
  console.log("\nSample (first 5):");
  for (const c of enriched.slice(0, 5)) {
    console.log(
      `  - [${c.state}] ${c.name} (${c.form}) — $${c.estimated_avg_finding.toLocaleString()} typical`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
