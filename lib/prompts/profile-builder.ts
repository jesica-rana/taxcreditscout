import { z } from "zod/v4";
import { jsonCompletion } from "../openai";
import type { RawIntake, UserProfile } from "../types";

const SYSTEM = `You are a tax credit research assistant. Your job is to translate a small business owner's casual description of their business and recent activities into a structured profile and a set of high-recall search queries.

Goal: maximize the chance that a downstream vector search over a database of tax credits finds every credit they might qualify for.

Generate exactly 8 derived_queries that each describe a DIFFERENT angle of their business or activity. Each query should be a short phrase (5-15 words) that would semantically match how an IRS or state DOR document describes eligible businesses or activities.

Examples of good derived_queries:
- "manufacturing business in California with 12 employees"
- "hired veterans or workers from disadvantaged groups in last 12 months"
- "purchased machinery or equipment over five thousand dollars"
- "developed software or improved a product through experimentation"
- "installed solar panels or energy efficient HVAC"
- "provided employer-sponsored health insurance to under 25 employees"
- "located in a federal opportunity zone or state enterprise zone"
- "small business in California paying franchise tax"

If the user's free_text mentions something specific (e.g. "we had a fire damage" or "we operate on tribal land"), make sure ONE of the queries captures that specifically.

Infer industries from the business description. Use simple lowercase tags from this list when possible: agriculture, construction, manufacturing, software, retail, food_service, healthcare, professional_services, real_estate, transportation, finance, energy, nonprofit, other.`;

const ProfileSchema = z.object({
  industries: z
    .array(z.string())
    .describe("Inferred industry tags"),
  derived_queries: z
    .array(z.string())
    .length(8)
    .describe("Exactly 8 search queries covering different angles"),
});

export async function buildProfile(raw: RawIntake): Promise<UserProfile> {
  const userMessage = `Business description: ${raw.business_description}
State: ${raw.state}
City: ${raw.city ?? "(none)"}
Employees: ${raw.employee_count}
Revenue band: ${raw.revenue_band}
Activities checked: ${raw.activities.join(", ") || "(none)"}
Free text: ${raw.free_text ?? "(none)"}

Build the profile.`;

  const result = await jsonCompletion({
    system: SYSTEM,
    user: userMessage,
    schema: ProfileSchema,
    schemaName: "profile",
  });

  return {
    business_description: raw.business_description,
    state: raw.state,
    city: raw.city,
    employee_count: raw.employee_count,
    revenue_band: raw.revenue_band,
    activities: raw.activities,
    free_text: raw.free_text,
    industries: result.industries,
    derived_queries: result.derived_queries,
  };
}
