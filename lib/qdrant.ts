import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBED_DIM } from "./openai";
import type { Credit, UserProfile } from "./types";

export const COLLECTION = process.env.QDRANT_COLLECTION || "tax_credits";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function ensureCollection(vectorSize: number = EMBED_DIM) {
  const exists = await qdrant
    .getCollection(COLLECTION)
    .then(() => true)
    .catch(() => false);
  if (exists) return;
  await qdrant.createCollection(COLLECTION, {
    vectors: { size: vectorSize, distance: "Cosine" },
  });
  // index payload fields we filter on
  for (const field of ["jurisdiction", "state", "city", "industries"]) {
    await qdrant
      .createPayloadIndex(COLLECTION, { field_name: field, field_schema: "keyword" })
      .catch(() => {});
  }
  for (const field of [
    "company_size_min_employees",
    "company_size_max_employees",
    "credit_amount_max",
    "deadline_critical",
  ]) {
    await qdrant
      .createPayloadIndex(COLLECTION, { field_name: field, field_schema: "integer" })
      .catch(() => {});
  }
}

export async function upsertCredit(point: {
  id: string | number;
  vector: number[];
  payload: Credit;
}) {
  await qdrant.upsert(COLLECTION, {
    points: [
      {
        id: point.id,
        vector: point.vector,
        payload: point.payload as unknown as Record<string, unknown>,
      },
    ],
  });
}

export async function upsertCreditsBatch(
  points: { id: string | number; vector: number[]; payload: Credit }[]
) {
  if (points.length === 0) return;
  await qdrant.upsert(COLLECTION, {
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload as unknown as Record<string, unknown>,
    })),
  });
}

export async function searchCredits(args: {
  vector: number[];
  profile: UserProfile;
  limit?: number;
}): Promise<Credit[]> {
  const { vector, profile, limit = 20 } = args;

  // Filter: must be Federal OR match user's state. Normalize to uppercase 2-letter
  // postal code so "ca" and "CA" both match credits indexed as "CA". Trim
  // whitespace defensively.
  const stateCode = (profile.state ?? "").trim().toUpperCase();
  const filter = {
    must: [
      {
        should: [
          { key: "jurisdiction", match: { value: "Federal" } },
          ...(stateCode
            ? [{ key: "state", match: { value: stateCode } }]
            : []),
        ],
      },
    ],
  };

  const results = await qdrant.search(COLLECTION, {
    vector,
    filter,
    limit,
    with_payload: true,
  });

  return results
    .map((r) => r.payload as unknown as Credit)
    .filter((c) => {
      // Hard size filter: statute is unambiguous, OK to drop here.
      if (c.company_size_min_employees > profile.employee_count) return false;
      if (
        c.company_size_max_employees != null &&
        c.company_size_max_employees < profile.employee_count
      )
        return false;
      // No industry pre-filter — let the verifier decide. Tag normalization
      // is too brittle (e.g., "aerospace" vs "manufacturing"), and semantic
      // search already ranks by relevance. Verifier is much better at
      // judging whether a credit applies.
      return true;
    });
}
