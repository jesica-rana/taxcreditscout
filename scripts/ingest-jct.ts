/**
 * Ingest the Joint Committee on Taxation Tax Expenditures report (JCX-45-25)
 * → structured Credit[] JSON.
 *
 * The JCT report is the canonical, government-issued list of every federal
 * tax expenditure (credits, deductions, exclusions, etc.) with 5-year revenue
 * cost estimates. We extract every credit, filter to small/mid-business-
 * applicable ones, and enrich each with IRC section, IRS form number, and
 * eligibility text using Claude's knowledge of US tax law.
 *
 * Pipeline:
 *   1. pdftotext -layout on Table 1 pages
 *   2. Claude parses table → list of credits with cost + SMB applicability flag
 *   3. Filter to SMB-applicable
 *   4. Claude enriches each into the full Credit schema
 *   5. Write data/credits-federal-jct.json
 *
 * Usage:
 *   npm run ingest:jct
 *   npm run ingest:jct -- --pdf=data/sources/jct-x-45-26.pdf --pages=34-44
 *   npm run ingest:jct -- --out=data/credits-federal-jct-2026.json
 *
 * Re-run annually when JCT publishes the next year's report (typically December).
 * Output is deterministic given the same PDF + same Claude model version.
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { z } from "zod/v4";
import { jsonCompletion, withRetry } from "../lib/openai";
import type { Credit } from "../lib/types";

const DEFAULT_PDF = path.resolve("data/sources/jct-x-45-25.pdf");
const DEFAULT_OUTPUT = path.resolve("data/credits-federal-jct.json");
const DEFAULT_CHECKPOINT = path.resolve("data/credits-federal-jct.stage1.json");
const DEFAULT_PAGES = "34-43";

// Sonnet 4.6 is ~10x cheaper than Opus and the per-credit enrichment task
// (filling structured fields from a detailed system prompt) does not need Opus.
const DEFAULT_ENRICH_MODEL = "claude-sonnet-4-6";

// ──────────────────────────────────────────────────────────────────────
// Stage 1 schema: extract every credit row from Table 1
// ──────────────────────────────────────────────────────────────────────
const ExtractedCreditSchema = z.object({
  name: z
    .string()
    .describe(
      "Verbatim credit name from the table, e.g. 'Credit for increasing research activities'"
    ),
  budget_function: z
    .string()
    .describe("Bold heading the row falls under, e.g. 'Energy'"),
  total_5yr_cost_billions: z
    .number()
    .describe(
      "Rightmost 'Total 2025-29' column value in $B. Use 0 if all entries are [2] (de minimis < $50M)."
    ),
  applies_to_corporations: z.boolean(),
  applies_to_individuals: z.boolean(),
  smb_applicable: z
    .boolean()
    .describe(
      "True if a typical US small/mid business (under 500 employees, under $50M revenue, not a residential filer) could realistically claim this credit."
    ),
});

const ExtractionSchema = z.object({
  credits: z.array(ExtractedCreditSchema),
});

// ──────────────────────────────────────────────────────────────────────
// Stage 2 schema: enrich each SMB credit with full schema fields
// ──────────────────────────────────────────────────────────────────────
const EnrichedCreditSchema = z.object({
  name: z.string(),
  irc_section: z
    .string()
    .describe("Short form like '45B' or '48' (no 'Section ' prefix)"),
  credit_amount_min: z.number().describe("Typical minimum SMB claim, USD"),
  credit_amount_max: z.number().describe("Typical maximum SMB claim, USD"),
  credit_type: z.enum([
    "per_employee",
    "percent_of_expense",
    "flat",
    "percent_of_revenue",
  ]),
  industries: z
    .array(z.string())
    .describe("Lowercase industry tags or ['all']"),
  company_size_min_employees: z.number().int(),
  company_size_max_employees: z.number().int().nullable(),
  revenue_min: z.number().nullable(),
  revenue_max: z.number().nullable(),
  form: z
    .string()
    .describe("Official IRS form number, e.g. 'IRS Form 5884'"),
  filing_deadline: z.string(),
  deadline_critical: z.boolean(),
  deadline_date: z.string().nullable(),
  eligibility_text: z
    .string()
    .describe(
      "250-500 word factual description: who qualifies, qualifying activities/expenses, dollar limits, key requirements. Cite IRC section. Do NOT invent rules."
    ),
  documentation_required: z.array(z.string()),
  url: z
    .string()
    .describe("Canonical IRS URL, e.g. https://www.irs.gov/forms-pubs/about-form-XXXX"),
  estimated_avg_finding: z
    .number()
    .describe("Conservative mid-range USD estimate of typical SMB claim"),
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

  const pdfPath = arg("pdf") ? path.resolve(arg("pdf")!) : DEFAULT_PDF;
  const outPath = arg("out") ? path.resolve(arg("out")!) : DEFAULT_OUTPUT;
  const checkpointPath = arg("checkpoint")
    ? path.resolve(arg("checkpoint")!)
    : DEFAULT_CHECKPOINT;
  const pages = arg("pages") ?? DEFAULT_PAGES;
  const [first, last] = pages.split("-").map((n) => parseInt(n));
  const enrichModel = arg("enrich-model") ?? DEFAULT_ENRICH_MODEL;
  const skipStage1 = args.includes("--skip-stage1");

  console.log(`PDF:        ${pdfPath}`);
  console.log(`Pages:      ${first}-${last}`);
  console.log(`Checkpoint: ${checkpointPath}`);
  console.log(`Output:     ${outPath}`);
  console.log(`Enrich w/:  ${enrichModel}\n`);

  // ── Stage 1+2 (cached): extract Table 1 text + Claude parse ────────
  let smbCredits: z.infer<typeof ExtractedCreditSchema>[];
  let allCount: number;
  if (skipStage1) {
    console.log("[1-2/3] Loading cached Stage 1+2 from checkpoint...");
    const cached = JSON.parse(
      await fs.readFile(checkpointPath, "utf-8")
    ) as { all: z.infer<typeof ExtractedCreditSchema>[] };
    allCount = cached.all.length;
    smbCredits = cached.all.filter((c) => c.smb_applicable);
    console.log(
      `  → loaded ${allCount} credits (${smbCredits.length} SMB-applicable)\n`
    );
  } else {
    console.log("[1/3] Extracting Table 1 text via pdftotext...");
    const tableText = execSync(
      `pdftotext -layout -f ${first} -l ${last} "${pdfPath}" -`,
      { maxBuffer: 8 * 1024 * 1024, encoding: "utf-8" }
    );
    console.log(`  → ${tableText.length} chars\n`);

    console.log("[2/3] Parsing Table 1 with Claude (Opus)...");
    const extracted = await withRetry(() =>
      jsonCompletion({
      system: `You are a tax policy analyst extracting structured records from the JCT (Joint Committee on Taxation) Tax Expenditures report Table 1.

Extract EVERY row in Table 1 whose name contains the word "credit" (case-insensitive). For each, capture name, budget function, total 5-year cost, and SMB applicability.

Mark smb_applicable=FALSE for credits that are inherently individual or residential:
  - Residential clean energy credit
  - Energy efficient home improvement credit
  - Credit for previously owned plug-in electric vehicles
  - Clean vehicle credit (personal use)
  - Credits for tuition for post-secondary education
  - Credit for child and dependent care (the parent-side credit, not employer-provided)
  - Credit for children and other dependents (CTC)
  - Earned income credit (EITC)
  - Adoption credit
  - Credit for certain individuals for elective deferrals and IRA contributions
  - Subsidies for insurance purchased through health benefit exchanges (premium tax credit)
  - Credit for holders of qualified zone academy bonds (repealed)
  - Qualified school construction bonds (repealed)
  - Build America bonds (repealed)
  - Credit for orphan drug research (pharma R&D, narrow)

Mark smb_applicable=TRUE for business-claimable credits:
  - Credit for increasing research activities (R&D, §41)
  - Energy credit (§48 ITC)
  - Credit for qualified commercial clean vehicles (§45W)
  - Credit for alternative fuel vehicle refueling property (§30C)
  - Advanced manufacturing production credit (§45X)
  - Advanced manufacturing investment credit (§48D)
  - Credit for construction of energy-efficient new homes (§45L)
  - Clean electricity ITC / Clean electricity production credit
  - Credits for electricity production from renewable resources
  - Credit for carbon oxide sequestration (§45Q)
  - Credit for production of clean hydrogen (§45V)
  - Clean fuel production credit (§45Z)
  - Credit for low-income housing (§42 LIHTC)
  - Credit for employer-paid FICA taxes on tips (§45B)
  - Credit for rehabilitation of historic structures (§47)
  - New markets tax credit (§45D)
  - Railroad track maintenance credit (§45G — narrow but include)
  - Credit for family and medical leave (§45S)
  - Work opportunity tax credit (§51)
  - Credit for employer-provided dependent care (§45F)
  - Tax credit for contributions to scholarship granting organizations
  - Zero emission nuclear power production credit (§45U — narrow)

Be exhaustive. Extract every credit row including small ones marked [2] (de minimis < $50M).`,
      user: `JCT Table 1 text (pdftotext -layout output):\n\n"""\n${tableText}\n"""\n\nExtract every credit row.`,
      schema: ExtractionSchema,
      maxTokens: 16000,
    })
  );
    const allCredits = extracted.credits;
    smbCredits = allCredits.filter((c) => c.smb_applicable);
    allCount = allCredits.length;
    console.log(
      `  → ${allCount} credit rows extracted (${smbCredits.length} SMB-applicable)`
    );
    await fs.mkdir(path.dirname(checkpointPath), { recursive: true });
    await fs.writeFile(
      checkpointPath,
      JSON.stringify({ all: allCredits }, null, 2)
    );
    console.log(`  → checkpoint saved to ${checkpointPath}\n`);
  }

  // ── Stage 3: enrich each SMB credit with full schema ──────────────
  console.log(`[3/3] Enriching ${smbCredits.length} SMB credits with ${enrichModel}...`);
  const enriched: Credit[] = [];
  for (let i = 0; i < smbCredits.length; i += 4) {
    const batch = smbCredits.slice(i, i + 4);
    const results = await Promise.all(
      batch.map((c) =>
        withRetry(() =>
          jsonCompletion({
            system: `You are a tax research assistant. Given a federal tax credit by name and JCT cost, produce a structured record using your knowledge of US federal tax law (IRC, Treasury Regs, IRS guidance).

Field guidelines:
- irc_section: short form like "45B", "48", "45F" (NO "Section " prefix, NO "§")
- credit_amount_min/max: typical SMB-scale claim range in USD
- credit_type: per_employee | percent_of_expense | flat | percent_of_revenue
- industries: lowercase tags ["software", "manufacturing"] or ["all"] if not restricted
- company_size_min_employees: 1 unless statute requires more
- company_size_max_employees: null unless statute caps (e.g., §45R Small Employer Health caps at 25 FTE)
- revenue_min/max: usually null; set if statute uses gross-receipts test (e.g., §41(h) payroll-tax election requires gross receipts under $5M)
- form: official IRS form, e.g. "IRS Form 8941", "IRS Form 6765", "IRS Form 3468"
- filing_deadline: short text like "with annual return"
- deadline_critical: true ONLY for hard one-time deadlines (e.g., §41 R&D retroactive election by 2026-07-04 under OBBBA)
- deadline_date: ISO 8601 if deadline_critical, else null
- eligibility_text: 250-500 words. Be FACTUAL and SPECIFIC. State qualifying activities, dollar limits, key tests. Cite IRC section. If you are uncertain about a specific number or rule, write "see IRC §X for full requirements" rather than inventing.
- documentation_required: array of forms/records to keep
- url: canonical IRS URL — for credits with their own form, use https://www.irs.gov/forms-pubs/about-form-XXXX
- estimated_avg_finding: conservative mid-range USD estimate of what a typical claiming SMB receives`,
            user: `Credit name: ${c.name}
JCT budget function: ${c.budget_function}
JCT 5-year cost (all filers, $B): ${c.total_5yr_cost_billions}
Applies to: ${[
              c.applies_to_corporations ? "corporations" : null,
              c.applies_to_individuals ? "individuals/passthroughs" : null,
            ]
              .filter(Boolean)
              .join(" + ")}

Produce the structured record.`,
            schema: EnrichedCreditSchema,
            model: enrichModel,
          })
        )
      )
    );
    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      const r = results[j];
      enriched.push({
        id: slugify(r.name) + "_federal",
        name: r.name,
        jurisdiction: "Federal",
        state: null,
        city: null,
        credit_amount_min: r.credit_amount_min,
        credit_amount_max: r.credit_amount_max,
        credit_type: r.credit_type,
        industries: r.industries,
        company_size_min_employees: r.company_size_min_employees,
        company_size_max_employees: r.company_size_max_employees,
        revenue_min: r.revenue_min,
        revenue_max: r.revenue_max,
        form: r.form,
        filing_deadline: r.filing_deadline,
        deadline_critical: r.deadline_critical,
        deadline_date: r.deadline_date,
        eligibility_text: r.eligibility_text,
        documentation_required: r.documentation_required,
        url: r.url,
        estimated_avg_finding: r.estimated_avg_finding,
        source_authority: "irs.gov + jct.gov",
        irc_section: r.irc_section,
        jct_5yr_cost_billions: c.total_5yr_cost_billions,
      });
    }
    console.log(
      `  enriched: ${Math.min(i + 4, smbCredits.length)}/${smbCredits.length}`
    );
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✓ Wrote ${enriched.length} credits to ${outPath}`);
  console.log("\nSample (first 5):");
  for (const c of enriched.slice(0, 5)) {
    console.log(
      `  - [${c.irc_section?.padEnd(4)}] ${c.name} (${c.form}) — $${c.estimated_avg_finding.toLocaleString()} typical`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
