/**
 * Read data/credits.json → embed each credit → upsert to Qdrant.
 *
 * Usage:
 *   npm run embed
 *   npm run embed -- --file=data/seed/sample-credits.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { z } from "zod";
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

  // Embed in batches of 32 with inputType="document" for index-side weighting
  console.log("Embedding...");
  const points: { id: string | number; vector: number[]; payload: Credit }[] =
    [];
  for (let i = 0; i < credits.length; i += 32) {
    const batch = credits.slice(i, i + 32);
    const texts = batch.map((c) =>
      buildEmbeddingText(c, scenariosByCredit.get(c.id) || [])
    );
    const vectors = await embedBatch(texts, "document");
    batch.forEach((c, idx) =>
      points.push({ id: uuidFromId(c.id), vector: vectors[idx], payload: c })
    );
    console.log(
      `  embedded: ${Math.min(i + 32, credits.length)}/${credits.length}`
    );
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
