import { z } from "zod/v4";
import { jsonCompletion } from "../openai";
import type { Credit } from "../types";

const SYSTEM = `You are a tax research assistant extracting structured records of business tax credits from official government sources (IRS forms pages, state Departments of Revenue, city economic-development pages).

For each distinct credit on the page, output one record. If the page describes a single credit, output one. If it lists many (like Form 3800 which references many credits), output one per credit.

Field guidelines:
- name: official name as cited on the page (e.g., "Work Opportunity Tax Credit (WOTC)")
- jurisdiction: "Federal" | "State" | "City" | "Private"
- state: 2-letter postal code if applicable, else null
- city: city name if local, else null
- credit_amount_min/max: best estimate from the page; if unstated, use 0 and 50000 as safe defaults
- credit_type: "per_employee" if amount scales with hires, "percent_of_expense" if a % of qualified expenditures, "flat" if a fixed amount, "percent_of_revenue" if revenue-based
- industries: ["all"] unless restricted; otherwise lowercase tags
- company_size_min_employees: 1 unless the page restricts (e.g., "for businesses with at least 5 employees" → 5)
- company_size_max_employees: null unless capped (e.g., Small Employer Health Insurance Credit caps at 25 → 25)
- form: official form number (e.g., "IRS Form 5884")
- filing_deadline: short text (e.g., "with annual return", "Form 8850 within 28 days of hire")
- deadline_critical: true ONLY if there is a hard one-time deadline (like the July 4 2026 R&D retroactive election); otherwise false
- deadline_date: ISO 8601 if deadline_critical, else null
- eligibility_text: the most informative 200-500 word description of who qualifies. Quote the source closely; do not paraphrase down to one sentence
- documentation_required: array of forms/documents the user must keep
- url: the source URL we passed in
- estimated_avg_finding: your honest mid-range guess for what a typical SMB might claim under this credit. Be conservative.

If the page describes something that's NOT a tax credit (e.g., a deduction, a loan, an SBA program), skip it — return zero credits in that case.`;

const CreditItemSchema = z.object({
  name: z.string(),
  jurisdiction: z.enum(["Federal", "State", "City", "Private"]),
  state: z.string().nullable(),
  city: z.string().nullable(),
  credit_amount_min: z.number(),
  credit_amount_max: z.number(),
  credit_type: z.enum([
    "per_employee",
    "percent_of_expense",
    "flat",
    "percent_of_revenue",
  ]),
  industries: z.array(z.string()),
  company_size_min_employees: z.number().int(),
  company_size_max_employees: z.number().int().nullable(),
  revenue_min: z.number().nullable(),
  revenue_max: z.number().nullable(),
  form: z.string(),
  filing_deadline: z.string(),
  deadline_critical: z.boolean(),
  deadline_date: z.string().nullable(),
  eligibility_text: z.string(),
  documentation_required: z.array(z.string()),
  estimated_avg_finding: z.number(),
});

const ExtractionSchema = z.object({
  credits: z.array(CreditItemSchema),
});

export async function extractCredits(args: {
  sourceUrl: string;
  sourceText: string;
  hint?: string;
}): Promise<Credit[]> {
  const result = await jsonCompletion({
    system: SYSTEM,
    user: `Source URL: ${args.sourceUrl}
${args.hint ? `Hint: ${args.hint}\n` : ""}
Page text:
"""
${args.sourceText.slice(0, 30000)}
"""

Extract every distinct tax credit from this page.`,
    schema: ExtractionSchema,
    schemaName: "credit_extraction",
  });

  return result.credits.map((c) => ({
    ...c,
    id:
      slugify(c.name) +
      (c.state ? `_${c.state.toLowerCase()}` : "") +
      (c.city ? `_${slugify(c.city)}` : ""),
    url: args.sourceUrl,
  }));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}
