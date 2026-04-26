/**
 * Enrich federal credit records using authoritative regulation text from
 * eCFR (26 CFR Part 1) and the IRS form/topic page.
 *
 * For each federal credit with an irc_section:
 *   1. Fetch 26 CFR §1.{irc_section}-1..9 from eCFR (live regulations)
 *   2. Fetch the IRS form/topic page text
 *   3. Send original record + both sources to Sonnet → get back updated record
 *   4. Compare; only re-write fields that genuinely improved
 *   5. Track which credits changed → re-embed only those
 *
 * Skips state credits (eCFR is federal only) and credits without irc_section.
 *
 *   npm run enrich:ecfr
 *   npm run enrich:ecfr -- --in=data/credits.json --out=data/credits.json
 *   npm run enrich:ecfr -- --dry-run        # don't write, just show diff
 */

import "./load-env";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod/v4";
import { jsonCompletion, withRetry } from "../lib/openai";
import { fetchTitle26Regs } from "../lib/ecfr";
import type { Credit } from "../lib/types";

const DEFAULT_IN = path.resolve("data/credits.json");
const DEFAULT_OUT = path.resolve("data/credits.json");
const DEFAULT_CHANGED_IDS = path.resolve("data/enriched-changed-ids.json");
const DEFAULT_MODEL = "claude-sonnet-4-6";

const EnrichmentSchema = z.object({
  changed: z
    .boolean()
    .describe("True if any field was meaningfully corrected. False if original is already accurate."),
  form: z.string().describe("Corrected official IRS form number, e.g. 'IRS Form 6765'"),
  url: z.string().describe("Best canonical IRS URL for this credit"),
  eligibility_text: z
    .string()
    .describe(
      "Refined 250-500 word eligibility description grounded in the provided regulation text. Cite IRC section. Be factual and specific. If sources are sparse, keep original."
    ),
  documentation_required: z.array(z.string()),
  notes: z
    .string()
    .describe("One short sentence explaining what was corrected, or 'no change needed'."),
});

async function fetchIrsPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TaxCreditScout/0.1; research)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 200 ? text.slice(0, 15000) : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (k: string) =>
    args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  const dryRun = args.includes("--dry-run");

  const inPath = arg("in") ? path.resolve(arg("in")!) : DEFAULT_IN;
  const outPath = arg("out") ? path.resolve(arg("out")!) : DEFAULT_OUT;
  const changedPath = arg("changed-ids")
    ? path.resolve(arg("changed-ids")!)
    : DEFAULT_CHANGED_IDS;
  const model = arg("model") ?? DEFAULT_MODEL;

  console.log(`In:    ${inPath}`);
  console.log(`Out:   ${outPath}${dryRun ? " (dry-run, not writing)" : ""}`);
  console.log(`Model: ${model}\n`);

  const credits = JSON.parse(await fs.readFile(inPath, "utf-8")) as Credit[];
  const eligibleIdxs = credits
    .map((c, i) => ({ c, i }))
    .filter(
      ({ c }) =>
        c.jurisdiction === "Federal" &&
        c.irc_section &&
        c.irc_section.length > 0
    );

  console.log(
    `Loaded ${credits.length} credits, ${eligibleIdxs.length} federal w/ IRC section\n`
  );

  const changedIds: string[] = [];
  const skipNoSource: string[] = [];

  for (let i = 0; i < eligibleIdxs.length; i += 4) {
    const batch = eligibleIdxs.slice(i, i + 4);
    const enriched = await Promise.all(
      batch.map(async ({ c }) => {
        const [cfrText, irsText] = await Promise.all([
          fetchTitle26Regs(c.irc_section!, 20000),
          fetchIrsPage(c.url),
        ]);
        if (!cfrText && !irsText) {
          return { c, result: null as null | z.infer<typeof EnrichmentSchema>, sources: 0 };
        }
        const result = await withRetry(() =>
          jsonCompletion({
            system: `You are a tax research assistant. You will be shown an existing credit record and authoritative source text (eCFR Treasury regulations and/or the IRS form/topic page). Your job:

1. Correct the IRS form number if the original is wrong (the IRS page usually states the correct form prominently).
2. Refine the eligibility_text to be factually grounded in the provided source text. Cite IRC section. Keep it 250-500 words.
3. Update documentation_required to match what the regs/IRS page actually require.
4. Set url to the best canonical IRS URL (often given in the IRS page or implied by form number).
5. Set changed=true only if you made meaningful corrections. If the original is already accurate, set changed=false and return the original values verbatim.

DO NOT invent facts not in the provided sources. If a source contradicts the original, trust the source. If both sources are silent on a point, keep the original phrasing.`,
            user: `Original credit record:
${JSON.stringify(
  {
    name: c.name,
    irc_section: c.irc_section,
    form: c.form,
    url: c.url,
    eligibility_text: c.eligibility_text,
    documentation_required: c.documentation_required,
  },
  null,
  2
)}

${cfrText ? `--- eCFR Treasury Regulations (26 CFR §1.${c.irc_section}-*) ---\n${cfrText}\n` : "(no eCFR regulations available for this section)"}

${irsText ? `--- IRS form/topic page (${c.url}) ---\n${irsText}\n` : "(IRS page fetch failed)"}

Produce the updated record.`,
            schema: EnrichmentSchema,
            model,
            maxTokens: 8000,
          })
        );
        return { c, result, sources: (cfrText ? 1 : 0) + (irsText ? 1 : 0) };
      })
    );

    for (const { c, result, sources } of enriched) {
      if (!result) {
        skipNoSource.push(`${c.irc_section} ${c.name}`);
        continue;
      }
      const meaningfulChange =
        result.changed &&
        (result.form !== c.form ||
          result.url !== c.url ||
          result.eligibility_text !== c.eligibility_text);
      if (meaningfulChange) {
        const idx = credits.findIndex((x) => x.id === c.id);
        if (idx >= 0) {
          credits[idx] = {
            ...credits[idx],
            form: result.form,
            url: result.url,
            eligibility_text: result.eligibility_text,
            documentation_required: result.documentation_required,
          };
          changedIds.push(c.id);
        }
        console.log(
          `  ✎ ${c.irc_section?.padEnd(5)} ${c.name.slice(0, 50)} [${sources} src] — ${result.notes}`
        );
        if (result.form !== c.form) {
          console.log(`      form: ${c.form} → ${result.form}`);
        }
      } else {
        console.log(
          `  · ${c.irc_section?.padEnd(5)} ${c.name.slice(0, 50)} [${sources} src] — ${result.notes}`
        );
      }
    }
  }

  console.log(`\nSummary: ${changedIds.length} credits changed, ${skipNoSource.length} skipped (no source)`);
  if (skipNoSource.length > 0) {
    console.log(`  skipped: ${skipNoSource.join(", ")}`);
  }

  if (!dryRun) {
    await fs.writeFile(outPath, JSON.stringify(credits, null, 2));
    await fs.writeFile(changedPath, JSON.stringify(changedIds, null, 2));
    console.log(`\n✓ Wrote ${credits.length} credits to ${outPath}`);
    console.log(`✓ Wrote ${changedIds.length} changed-ids to ${changedPath}`);
    if (changedIds.length > 0) {
      console.log(
        `\nNext: re-embed the changed credits with:\n  node scripts/embed-changed.ts  (or jq-filter credits.json by these IDs and run npm run embed)`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
