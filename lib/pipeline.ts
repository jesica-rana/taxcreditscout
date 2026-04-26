import { embedBatch } from "./openai";
import { searchCredits } from "./qdrant";
import { buildProfile } from "./prompts/profile-builder";
import { verifyAll } from "./prompts/eligibility-verifier";
import { composeReport } from "./prompts/report-composer";
import type { Credit, RawIntake, Report, UserProfile, VerifiedCredit } from "./types";

export interface PipelineResult {
  profile: UserProfile;
  candidates: Credit[];
  verified: VerifiedCredit[];
  report: Report;
  timing_ms: {
    profile: number;
    retrieval: number;
    verification: number;
    composition: number;
    total: number;
  };
}

export async function runPipeline(args: {
  sessionId: string;
  raw: RawIntake;
  onProgress?: (stage: string) => void;
}): Promise<PipelineResult> {
  const { sessionId, raw, onProgress } = args;
  const t0 = Date.now();

  onProgress?.("building_profile");
  const profile = await buildProfile(raw);
  const t1 = Date.now();

  onProgress?.("retrieval");
  // Voyage AI: pass "query" inputType so the model uses the retrieval-side
  // weights. Documents are indexed with the default "document" inputType.
  const queryVectors = await embedBatch(profile.derived_queries, "query");
  const candidateMap = new Map<string, Credit>();
  for (const vec of queryVectors) {
    const hits = await searchCredits({ vector: vec, profile, limit: 20 });
    for (const c of hits) candidateMap.set(c.id, c);
  }
  const candidates = Array.from(candidateMap.values());
  const t2 = Date.now();

  onProgress?.("verifying");
  const allVerified = await verifyAll(profile, candidates, 8);
  const verified = allVerified
    .filter((v) => v.qualifies !== "no" && v.confidence >= 0.6)
    .sort((a, b) => b.estimated_credit_high - a.estimated_credit_high);
  const t3 = Date.now();

  onProgress?.("composing");
  const report = await composeReport({ sessionId, profile, verified });
  const t4 = Date.now();

  return {
    profile,
    candidates,
    verified,
    report,
    timing_ms: {
      profile: t1 - t0,
      retrieval: t2 - t1,
      verification: t3 - t2,
      composition: t4 - t3,
      total: t4 - t0,
    },
  };
}
