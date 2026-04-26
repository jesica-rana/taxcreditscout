/**
 * Scrape source URLs → run GPT credit extractor → write data/credits.json
 *
 * Usage:
 *   npm run scrape                # all sources
 *   npm run scrape -- --tier=1    # just federal
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { SOURCES, type Source } from "./sources";
import { extractCredits } from "../lib/prompts/credit-extractor";
import type { Credit } from "../lib/types";

const DATA_FILE = path.resolve("data/credits.json");
const RAW_DIR = path.resolve("data/raw");

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TaxCreditScout/0.1; research)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Fetch ${url} → HTTP ${res.status}`);
  const html = await res.text();
  // Cheap strip: drop scripts/styles, then collapse whitespace
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function processSource(src: Source): Promise<Credit[]> {
  console.log(`→ ${src.url}`);
  let text: string;
  try {
    text = await fetchText(src.url);
  } catch (err) {
    console.error(`  fetch failed:`, err);
    return [];
  }

  // Cache raw text for debugging
  await fs.mkdir(RAW_DIR, { recursive: true });
  const cacheKey = src.url.replace(/[^a-z0-9]/gi, "_").slice(0, 80);
  await fs.writeFile(path.join(RAW_DIR, `${cacheKey}.txt`), text);

  if (text.length < 500) {
    console.warn(`  page too short (${text.length} chars), skipping`);
    return [];
  }

  try {
    const credits = await extractCredits({
      sourceUrl: src.url,
      sourceText: text,
      hint: src.hint,
    });
    // Override jurisdiction/state/city from source metadata if missing
    return credits.map((c) => ({
      ...c,
      jurisdiction: c.jurisdiction || src.jurisdiction,
      state: c.state ?? src.state ?? null,
      city: c.city ?? src.city ?? null,
    }));
  } catch (err) {
    console.error(`  extraction failed:`, err);
    return [];
  }
}

async function main() {
  const tierArg = process.argv.find((a) => a.startsWith("--tier="));
  const tier = tierArg ? parseInt(tierArg.split("=")[1]) : null;

  let sources: Source[] = SOURCES;
  if (tier === 1) sources = SOURCES.filter((s) => s.jurisdiction === "Federal");
  else if (tier === 2) sources = SOURCES.filter((s) => s.jurisdiction === "State");
  else if (tier === 3) sources = SOURCES.filter((s) => s.jurisdiction === "City");

  console.log(`Processing ${sources.length} sources...`);

  const all: Credit[] = [];
  for (const src of sources) {
    const credits = await processSource(src);
    all.push(...credits);
    console.log(`  + ${credits.length} credits (running total: ${all.length})`);
  }

  // Dedupe by (name, jurisdiction, state) — keep longest eligibility text
  const dedupedMap = new Map<string, Credit>();
  for (const c of all) {
    const key = `${c.name}::${c.jurisdiction}::${c.state ?? ""}`;
    const existing = dedupedMap.get(key);
    if (!existing || existing.eligibility_text.length < c.eligibility_text.length) {
      dedupedMap.set(key, c);
    }
  }
  const deduped = Array.from(dedupedMap.values());

  // Quality filter
  const final = deduped.filter((c) => c.eligibility_text.length >= 100);

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(final, null, 2));
  console.log(`\n✓ Wrote ${final.length} credits to ${DATA_FILE}`);
  console.log(`  (dropped ${all.length - final.length} duplicates/short)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
