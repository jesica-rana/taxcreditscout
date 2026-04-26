/**
 * Merge all credit sources into a single data/credits.json that the embed
 * pipeline reads. Dedup logic: when an IRC section appears in multiple
 * sources, the hand-curated seed wins over the auto-generated JCT data
 * (the seed has richer eligibility text, the JCT has wider coverage).
 *
 *   npm run merge                                # default sources
 *   npm run merge -- --out=data/credits.json
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Credit } from "../lib/types";

interface CreditSource {
  label: string;
  path: string;
  // IRC sections owned by this source — JCT credits with these sections are
  // skipped because the seed has hand-curated eligibility text for them.
  owned_irc_sections?: string[];
}

const SEED_OWNED_IRC = ["41", "44", "45E", "45R", "45S", "51", "1400Z"];

const SOURCES: CreditSource[] = [
  {
    label: "seed (hand-curated)",
    path: "data/seed/sample-credits.json",
    owned_irc_sections: SEED_OWNED_IRC,
  },
  {
    label: "JCT JCX-45-25 (federal)",
    path: "data/credits-federal-jct.json",
  },
  {
    label: "State R&D (37 states)",
    path: "data/credits-state-rd.json",
  },
];

async function main() {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith("--out="))?.split("=")[1];
  const outPath = path.resolve(outArg ?? "data/credits.json");

  const merged: Credit[] = [];
  const ircTaken = new Set<string>(SEED_OWNED_IRC);
  const idTaken = new Set<string>();

  for (const src of SOURCES) {
    const filePath = path.resolve(src.path);
    let credits: Credit[];
    try {
      credits = JSON.parse(await fs.readFile(filePath, "utf-8")) as Credit[];
    } catch {
      console.warn(`  ⚠ ${src.label}: file not found at ${src.path}, skipping`);
      continue;
    }

    let added = 0;
    let skippedIrc = 0;
    let skippedId = 0;
    for (const c of credits) {
      // Skip if this IRC section is already covered by a higher-priority source.
      if (
        c.irc_section &&
        ircTaken.has(c.irc_section) &&
        !src.owned_irc_sections?.includes(c.irc_section)
      ) {
        skippedIrc++;
        continue;
      }
      if (idTaken.has(c.id)) {
        skippedId++;
        continue;
      }
      merged.push(c);
      idTaken.add(c.id);
      if (c.irc_section) ircTaken.add(c.irc_section);
      added++;
    }
    console.log(
      `  ${src.label}: +${added}${
        skippedIrc ? ` (skipped ${skippedIrc} IRC dupes)` : ""
      }${skippedId ? ` (skipped ${skippedId} id dupes)` : ""}`
    );
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(merged, null, 2));

  const byJur = merged.reduce<Record<string, number>>((acc, c) => {
    acc[c.jurisdiction] = (acc[c.jurisdiction] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\n✓ Wrote ${merged.length} credits to ${outPath}`);
  console.log(`  by jurisdiction: ${JSON.stringify(byJur)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
