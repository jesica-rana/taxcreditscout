import { z } from "zod";
import { jsonCompletion } from "../openai";
import type { Credit, UserProfile, VerifiedCredit } from "../types";

const SYSTEM = `You are a tax credit eligibility analyst. You will be given (1) a small business profile and (2) a single tax credit's eligibility criteria. Your job is to determine whether the business clearly qualifies for this specific credit, and if so estimate the dollar value.

Be conservative. The cost of a false positive (telling someone they qualify when they don't) is much higher than a false negative. A user is going to take this report to their CPA and look foolish if you've flagged credits that don't apply.

Output:
- qualifies: "yes" if all stated criteria are clearly met, "likely" if most criteria are met but one or two need verification, "no" if any criterion clearly fails or is unsupported by the profile.
- confidence: 0.0 to 1.0. Reserve >0.8 for slam-dunks where the profile explicitly mentions the qualifying activity.
- estimated_credit_low / _high: dollar range based on the credit's amount structure and the user's size. Be conservative on the high end. Round to nearest $100.
- reasoning: 2-3 sentences in plain English explaining the determination.
- what_to_verify: array of up to 3 short items the user/CPA should confirm before claiming. Empty array if nothing.

If the credit has a hard size or industry restriction the business doesn't meet, return qualifies: "no" with low confidence.`;

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
Jurisdiction: ${c.jurisdiction}${c.state ? ` (${c.state})` : ""}${c.city ? ` — ${c.city}` : ""}
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
