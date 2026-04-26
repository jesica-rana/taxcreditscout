/**
 * eCFR (electronic Code of Federal Regulations) API client.
 *
 * eCFR is the official, live-updated US federal regulation database.
 * For tax credits, regulations live in Title 26 (Internal Revenue) under
 * §1.{IRC_section}-{n} where n is typically 1-9. Example: IRC §41 (R&D
 * credit) has Treasury regs at 26 CFR §1.41-1, §1.41-2, ..., §1.41-9.
 *
 * No API key required. Public domain. Live-updated.
 *
 * Caveat: brand-new IRC sections (45V hydrogen, 45X advanced manufacturing,
 * 45Z clean fuel) often have NO Treasury regs yet — Congress passed the
 * statute but Treasury hasn't written the regs. fetchTitle26Regs returns
 * null in that case; callers should fall back to IRS notices or form pages.
 */

const ECFR_BASE = "https://www.ecfr.gov/api/versioner/v1";

let title26DateCache: string | null = null;

export async function getLatestTitle26Date(): Promise<string> {
  if (title26DateCache) return title26DateCache;
  const res = await fetch(`${ECFR_BASE}/titles`);
  if (!res.ok) throw new Error(`eCFR titles ${res.status}`);
  const json = (await res.json()) as {
    titles: { number: number; latest_issue_date: string }[];
  };
  const t26 = json.titles.find((t) => t.number === 26);
  if (!t26) throw new Error("Title 26 not found in eCFR");
  title26DateCache = t26.latest_issue_date;
  return title26DateCache;
}

/**
 * Strip XML tags + decode common entities → plain text.
 * eCFR XML uses <DIV8>, <HEAD>, <P>, <I>, <DIV>, <TABLE>, etc.
 */
function xmlToText(xml: string): string {
  return xml
    .replace(/<HEAD[^>]*>([^<]*)<\/HEAD>/gi, "\n## $1\n")
    .replace(/<\/(P|DIV)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#160;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Fetch a single CFR section. Returns null on 404 (section doesn't exist).
 */
async function fetchOneSection(
  date: string,
  section: string
): Promise<string | null> {
  const url = `${ECFR_BASE}/full/${date}/title-26.xml?section=${section}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`eCFR ${section} HTTP ${res.status}`);
  const xml = await res.text();
  const text = xmlToText(xml);
  // Empty or trivial response (just the header)
  if (text.length < 100) return null;
  return text;
}

/**
 * Fetch all available regulations for a given IRC section.
 * Tries §1.{ircSection}-1 through §1.{ircSection}-9.
 *
 * Returns concatenated text, or null if no regulations exist.
 *
 * @param ircSection IRC section like "41", "45B", "45S"
 * @param maxBytes truncate combined text at this size (default 30k chars)
 */
export async function fetchTitle26Regs(
  ircSection: string,
  maxBytes = 30000
): Promise<string | null> {
  const date = await getLatestTitle26Date();
  const parts: string[] = [];
  let totalLen = 0;
  // Fetch in parallel; eCFR seems robust enough for 9 concurrent requests.
  const candidates = Array.from(
    { length: 9 },
    (_, i) => `1.${ircSection}-${i + 1}`
  );
  const results = await Promise.all(
    candidates.map((s) => fetchOneSection(date, s).catch(() => null))
  );
  for (let i = 0; i < results.length; i++) {
    const text = results[i];
    if (text) {
      const header = `\n=== 26 CFR §${candidates[i]} ===\n`;
      parts.push(header + text);
      totalLen += header.length + text.length;
      if (totalLen >= maxBytes) break;
    }
  }
  if (parts.length === 0) return null;
  const combined = parts.join("\n\n");
  return combined.length > maxBytes ? combined.slice(0, maxBytes) : combined;
}
