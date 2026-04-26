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

  // Filter: must be Federal OR match user's state. Industry filter is permissive.
  const filter = {
    must: [
      {
        should: [
          { key: "jurisdiction", match: { value: "Federal" } },
          { key: "state", match: { value: profile.state } },
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
      // Post-filter for size/industry to keep Qdrant filter simple
      if (c.company_size_min_employees > profile.employee_count) return false;
      if (
        c.company_size_max_employees != null &&
        c.company_size_max_employees < profile.employee_count
      )
        return false;
      if (c.industries.includes("all")) return true;
      return c.industries.some((i) => profile.industries.includes(i));
    });
}
