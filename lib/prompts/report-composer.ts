import { z } from "zod/v4";
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

const ReportSchema = z.object({
  business_summary: z.string(),
  sections: z.array(
    z.object({
      credit_id: z.string(),
      why_you_qualify: z.string(),
      action_steps: z.array(z.string()).min(2).max(4),
    })
  ),
  action_plan_this_week: z.array(z.string()).min(2).max(4),
  action_plan_this_month: z.array(z.string()).min(2).max(4),
  action_plan_this_quarter: z.array(z.string()).min(2).max(4),
  cpa_handoff_summary: z.string(),
});

const DISCLAIMER =
  "This report is informational research and not tax advice. All findings should be verified with a qualified CPA or tax attorney before filing. TaxCreditScout never interacts with the IRS on your behalf.";

function firstNSentences(text: string, n = 2): string {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g);
  if (!sentences || sentences.length === 0) return text.slice(0, 280);
  return sentences.slice(0, n).join("").trim();
}

export async function composeReport(args: {
  sessionId: string;
  profile: UserProfile;
  verified: VerifiedCredit[];
}): Promise<Report> {
  const { sessionId, profile, verified } = args;

  // Skip the LLM entirely on zero matches — no point asking it to write a
  // report about credits that don't exist. Return an honest empty-state
  // instead of a $0 report that looks broken.
  if (verified.length === 0) {
    return {
      session_id: sessionId,
      generated_at: new Date().toISOString(),
      business_summary: `Based on your intake (${profile.business_description.slice(0, 120)}${profile.business_description.length > 120 ? "…" : ""}), we couldn't confidently match any credits in our database. This usually means either (a) the intake was too sparse for the verifier to confirm a match, or (b) the credits you might qualify for require a more specific activity description.`,
      total_estimated_low: 0,
      total_estimated_high: 0,
      critical_deadlines: [],
      federal: [],
      state: [],
      local: [],
      action_plan_this_week: [
        "Retake the quiz with more detail about specific activities (R&D projects, recent hires from target groups, energy installations, retirement plans, health benefits offered).",
        "Talk to a CPA — even a brief consultation often surfaces credits an automated tool misses.",
      ],
      action_plan_this_month: [
        "Review your prior-year return for credits you might be entitled to retroactively (R&D credits can be claimed up to 3 years back via amended return).",
      ],
      action_plan_this_quarter: [
        "Set up a quarterly review with your CPA to capture credits as activities happen, not at year-end.",
      ],
      cpa_handoff_summary:
        "TaxCreditScout did not surface any high-confidence credit matches based on the intake provided. This is not a guarantee of non-eligibility — please review with your CPA, particularly around R&D credit (§41), Work Opportunity Tax Credit (§51), and any state-level credits for your jurisdiction.",
      disclaimer: DISCLAIMER,
    };
  }

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

  const llm = await jsonCompletion({
    system: SYSTEM,
    user: userMessage,
    schema: ReportSchema,
    schemaName: "report",
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
      how_it_works: firstNSentences(v.credit.eligibility_text, 2),
      irc_section: v.credit.irc_section ?? null,
      action_steps: llmPart?.action_steps || [
        "Review eligibility with your CPA",
        "Gather supporting documentation",
      ],
      form: v.credit.form,
      deadline: v.credit.filing_deadline,
      deadline_critical: v.credit.deadline_critical,
      documentation: v.credit.documentation_required,
      source_url: v.credit.url,
      what_to_verify: v.what_to_verify,
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
    local: sections.filter(
      (s) => s.jurisdiction === "City" || s.jurisdiction === "Private"
    ),
    action_plan_this_week: llm.action_plan_this_week,
    action_plan_this_month: llm.action_plan_this_month,
    action_plan_this_quarter: llm.action_plan_this_quarter,
    cpa_handoff_summary: llm.cpa_handoff_summary,
    disclaimer: DISCLAIMER,
  };
}
