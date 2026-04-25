import { jsonCompletion } from "../openai";
import type { Report, ReportSection, UserProfile, VerifiedCredit } from "../types";

const SYSTEM = `You are a senior tax credit consultant writing a polished report deliverable for a small business owner. The report will be a 12-page PDF the user takes to their CPA.

Tone: professional, plain-English, action-oriented. No tax-jargon walls. No "may qualify" hedging in the prose — the verifier already filtered down to qualified credits, so you write with confidence (while still using "estimated" for dollar amounts and including the disclaimer).

Output the structured report. Required pieces:
- business_summary: 1-2 sentence summary of the business in your own words
- For each credit, write a "why_you_qualify" of 2-3 sentences and 2-4 concrete "action_steps" (what to do this week)
- action_plan_this_week / _month / _quarter: each is a list of 2-4 imperative bullets
- cpa_handoff_summary: a single paragraph (4-6 sentences) the user can paste into an email to their CPA listing the credits found, their forms, and the rough total

Always include the legal disclaimer at the end (we'll provide it).`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    business_summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          credit_id: { type: "string" },
          why_you_qualify: { type: "string" },
          action_steps: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
        },
        required: ["credit_id", "why_you_qualify", "action_steps"],
      },
    },
    action_plan_this_week: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    action_plan_this_month: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    action_plan_this_quarter: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    cpa_handoff_summary: { type: "string" },
  },
  required: [
    "business_summary",
    "sections",
    "action_plan_this_week",
    "action_plan_this_month",
    "action_plan_this_quarter",
    "cpa_handoff_summary",
  ],
} as const;

const DISCLAIMER =
  "This report is informational research and not tax advice. All findings should be verified with a qualified CPA or tax attorney before filing. TaxCreditScout never interacts with the IRS on your behalf.";

export async function composeReport(args: {
  sessionId: string;
  profile: UserProfile;
  verified: VerifiedCredit[];
}): Promise<Report> {
  const { sessionId, profile, verified } = args;

  const userMessage = `Profile:
${profile.business_description}
${profile.city ? profile.city + ", " : ""}${profile.state} | ${profile.employee_count} employees | ${profile.revenue_band}

Qualified credits (the verifier already filtered):
${verified
  .map(
    (v) => `
- ID: ${v.credit.id}
  Name: ${v.credit.name}
  Jurisdiction: ${v.credit.jurisdiction}${v.credit.state ? ` (${v.credit.state})` : ""}${v.credit.city ? ` — ${v.credit.city}` : ""}
  Form: ${v.credit.form}
  Estimated: $${v.estimated_credit_low.toLocaleString()} – $${v.estimated_credit_high.toLocaleString()}
  Verifier reasoning: ${v.reasoning}
  What to verify: ${v.what_to_verify.join("; ") || "(nothing)"}`
  )
  .join("\n")}

Compose the report.`;

  const llm = await jsonCompletion<{
    business_summary: string;
    sections: { credit_id: string; why_you_qualify: string; action_steps: string[] }[];
    action_plan_this_week: string[];
    action_plan_this_month: string[];
    action_plan_this_quarter: string[];
    cpa_handoff_summary: string;
  }>({
    system: SYSTEM,
    user: userMessage,
    schema: SCHEMA,
    schemaName: "report",
    temperature: 0.4,
  });

  // Materialize ReportSections by joining LLM output with the credit metadata
  const sectionMap = new Map(llm.sections.map((s) => [s.credit_id, s]));
  const buildSection = (v: VerifiedCredit): ReportSection => {
    const llmPart = sectionMap.get(v.credit.id);
    return {
      credit_id: v.credit.id,
      name: v.credit.name,
      jurisdiction: v.credit.jurisdiction,
      estimated_low: v.estimated_credit_low,
      estimated_high: v.estimated_credit_high,
      why_you_qualify: llmPart?.why_you_qualify || v.reasoning,
      action_steps: llmPart?.action_steps || ["Review eligibility with your CPA", "Gather supporting documentation"],
      form: v.credit.form,
      deadline: v.credit.filing_deadline,
      deadline_critical: v.credit.deadline_critical,
      documentation: v.credit.documentation_required,
      source_url: v.credit.url,
    };
  };

  const sections = verified.map(buildSection);
  const total_low = sections.reduce((a, s) => a + s.estimated_low, 0);
  const total_high = sections.reduce((a, s) => a + s.estimated_high, 0);

  return {
    session_id: sessionId,
    generated_at: new Date().toISOString(),
    business_summary: llm.business_summary,
    total_estimated_low: total_low,
    total_estimated_high: total_high,
    critical_deadlines: sections.filter((s) => s.deadline_critical),
    federal: sections.filter((s) => s.jurisdiction === "Federal"),
    state: sections.filter((s) => s.jurisdiction === "State"),
    local: sections.filter((s) => s.jurisdiction === "City" || s.jurisdiction === "Private"),
    action_plan_this_week: llm.action_plan_this_week,
    action_plan_this_month: llm.action_plan_this_month,
    action_plan_this_quarter: llm.action_plan_this_quarter,
    cpa_handoff_summary: llm.cpa_handoff_summary,
    disclaimer: DISCLAIMER,
  };
}
