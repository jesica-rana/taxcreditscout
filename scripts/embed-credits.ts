/**
 * Read data/credits.json → embed each credit → upsert to Qdrant.
 *
 * Usage:
 *   npm run embed
 *   npm run embed -- --file=data/seed/sample-credits.json
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod/v4";
import { embedBatch, jsonCompletion, EMBED_DIM } from "../lib/openai";
import { ensureCollection, upsertCreditsBatch } from "../lib/qdrant";
import { buildEmbeddingText } from "../lib/embedding-text";
import type { Credit } from "../lib/types";
import { createHash } from "node:crypto";

const ScenariosSchema = z.object({
  scenarios: z.array(z.string()).length(3),
});

async function generateScenarios(credit: Credit): Promise<string[]> {
  try {
    const result = await jsonCompletion({
      system: `Given a tax credit, write exactly 3 short plain-language scenarios (1 sentence each) describing concrete situations where a small business would qualify. The goal is to help semantic search match user descriptions of activities to this credit. Use everyday language, not legal jargon.`,
      user: `Credit: ${credit.name}\nEligibility: ${credit.eligibility_text}\n\nWrite 3 scenarios.`,
      schema: ScenariosSchema,
      schemaName: "scenarios",
      // Sonnet handles this short, structured task fine and is ~10x cheaper than Opus.
      model: "claude-sonnet-4-6",
    });
    return result.scenarios;
  } catch {
    return [];
  }
}

function uuidFromId(id: string): string {
  // Qdrant accepts uint or UUID. We hash the slug to a deterministic UUID.
  const hash = createHash("md5").update(id).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const file = fileArg
    ? path.resolve(fileArg.split("=")[1])
    : path.resolve("data/credits.json");

  const raw = await fs.readFile(file, "utf-8");
  const credits = JSON.parse(raw) as Credit[];
  console.log(`Loaded ${credits.length} credits from ${file}`);

  await ensureCollection(EMBED_DIM);

  // Generate scenarios in parallel batches
  console.log("Generating scenarios...");
  const scenariosByCredit = new Map<string, string[]>();
  for (let i = 0; i < credits.length; i += 8) {
    const batch = credits.slice(i, i + 8);
    const results = await Promise.all(batch.map((c) => generateScenarios(c)));
    batch.forEach((c, idx) => scenariosByCredit.set(c.id, results[idx]));
    console.log(
      `  scenarios: ${Math.min(i + 8, credits.length)}/${credits.length}`
    );
  }

  // Embed in batches with inputType="document" for index-side weighting.
  // Voyage free tier (no payment method) caps at 3 RPM and 10K TPM. Each
  // credit's embedding text is ~2.5K tokens, so batch=4 (~10K tokens) +
  // 65s sleep between batches keeps us safely inside both limits. Override
  // with VOYAGE_EMBED_BATCH and VOYAGE_EMBED_SLEEP_MS once paid limits are on.
  const batchSize = Number(process.env.VOYAGE_EMBED_BATCH || 4);
  const sleepMs = Number(process.env.VOYAGE_EMBED_SLEEP_MS || 65000);
  console.log(
    `Embedding (batch=${batchSize}, sleep=${sleepMs / 1000}s between batches)...`
  );
  const points: { id: string | number; vector: number[]; payload: Credit }[] =
    [];
  for (let i = 0; i < credits.length; i += batchSize) {
    const batch = credits.slice(i, i + batchSize);
    const texts = batch.map((c) =>
      buildEmbeddingText(c, scenariosByCredit.get(c.id) || [])
    );
    const vectors = await embedBatch(texts, "document");
    batch.forEach((c, idx) =>
      points.push({ id: uuidFromId(c.id), vector: vectors[idx], payload: c })
    );
    const done = Math.min(i + batchSize, credits.length);
    console.log(`  embedded: ${done}/${credits.length}`);
    if (done < credits.length) {
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  // Upsert in batches of 64
  console.log("Upserting to Qdrant...");
  for (let i = 0; i < points.length; i += 64) {
    await upsertCreditsBatch(points.slice(i, i + 64));
  }

  console.log(`\n✓ Indexed ${credits.length} credits in Qdrant collection`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
