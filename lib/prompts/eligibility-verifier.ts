import { z } from "zod/v4";
import { jsonCompletion } from "../openai";
import type { Credit, UserProfile, VerifiedCredit } from "../types";

const SYSTEM = `You are a tax credit eligibility analyst. You will be given (1) a small business profile and (2) a single tax credit's eligibility criteria. Your job is to determine whether the business plausibly qualifies, and estimate the dollar value if so.

The intake captures the business at a high level — industry, size, state, recent activities. It does NOT enumerate every qualifying activity the business performs. Treat the profile as a starting signal, not a deposition. If a credit is plausible given the business type, return "likely" with what_to_verify items, NOT "no".

Use "no" ONLY when:
  - The credit has a HARD eligibility gate the business clearly fails (wrong state for a state credit, employee count outside the statutory range, wrong industry e.g. FICA tip credit for a logistics company)
  - OR the profile explicitly contradicts the credit's premise (e.g., "we have no employees" for a hiring credit)

Use "likely" when:
  - The business type plausibly involves the qualifying activity (e.g., aerospace components manufacturer + R&D credit, restaurant + FICA tip credit, any employer + WOTC, any company offering health insurance + §45R Small Employer Health)
  - But verification is needed (did they actually have qualifying expenses, hires, or installations?)

Use "yes" when the profile EXPLICITLY mentions the qualifying activity (e.g., "we hired 3 veterans in 2024" + WOTC).

Output fields:
- qualifies: "yes" | "likely" | "no" per above
- confidence: 0.0 to 1.0. Use 0.6-0.8 for "likely" determinations grounded in business type. Reserve >0.8 for explicit confirmations. <0.5 only when the profile is genuinely ambiguous.
- estimated_credit_low / _high: dollar range based on credit structure and user's size. Be conservative on the high end. Round to nearest $100.
- reasoning: 2-3 sentences explaining the determination.
- what_to_verify: up to 3 short items the user/CPA should confirm before claiming. Use this generously for "likely" — it's the right place for caveats.`;

const EligibilitySchema = z.object({
  qualifies: z.enum(["yes", "likely", "no"]),
  confidence: z.number().min(0).max(1),
  estimated_credit_low: z.number().min(0),
  estimated_credit_high: z.number().min(0),
  reasoning: z.string(),
  what_to_verify: z.array(z.string()).max(3),
});

function profileBlurb(p: UserProfile): string {
  return `Business: ${p.business_description}
Location: ${p.city ? p.city + ", " : ""}${p.state}
Employees: ${p.employee_count}
Revenue band: ${p.revenue_band}
Industries: ${p.industries.join(", ") || "(unspecified)"}
Recent activities: ${p.activities.join(", ") || "(none reported)"}
Free text: ${p.free_text ?? "(none)"}`;
}

function creditBlurb(c: Credit): string {
  return `Credit: ${c.name}
Jurisdiction: ${c.jurisdiction}${c.state ? ` (${c.state})` : ""}${c.city ? ` — ${c.city}` : ""}${c.irc_section ? ` · IRC §${c.irc_section}` : ""}
Form: ${c.form}
Amount range: $${c.credit_amount_min.toLocaleString()} – $${c.credit_amount_max.toLocaleString()} (${c.credit_type})
Size restriction: ${c.company_size_min_employees}+ employees${c.company_size_max_employees != null ? `, max ${c.company_size_max_employees}` : ""}
Industries: ${c.industries.join(", ")}
Eligibility text:
${c.eligibility_text}
Documentation required: ${c.documentation_required.join(", ")}`;
}

export async function verifyOne(
  profile: UserProfile,
  credit: Credit
): Promise<VerifiedCredit> {
  const result = await jsonCompletion({
    system: SYSTEM,
    user: `${profileBlurb(profile)}\n\n${creditBlurb(credit)}\n\nDoes this business qualify?`,
    schema: EligibilitySchema,
    schemaName: "eligibility",
  });

  return { credit, ...result };
}

export async function verifyAll(
  profile: UserProfile,
  candidates: Credit[],
  concurrency = 8
): Promise<VerifiedCredit[]> {
  const results: VerifiedCredit[] = [];
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const verified = await Promise.all(
      batch.map((c) =>
        verifyOne(profile, c).catch((err) => {
          console.error(`Verifier failed for ${c.id}:`, err);
          return null;
        })
      )
    );
    for (const v of verified) if (v) results.push(v);
  }
  return results;
}
