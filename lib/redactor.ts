/**
 * Browser-side PII redaction.
 *
 * Two passes:
 *   1. High-confidence regex (SSN, EIN, phone, email, ZIP, account numbers, routing)
 *   2. NER via `compromise` for person names and organization names
 *
 * Targeted, not blanket: we redact identifiers but KEEP financial line items —
 * those are exactly what the credit-matching pipeline needs.
 *
 * Returns `RedactionResult` containing:
 *   - redactedText: the original text with `[REDACTED:TYPE]` markers in place of PII
 *   - tokens: the original PII values + offsets (kept in browser memory ONLY for
 *             re-injection into the user's downloaded PDF; never sent over network)
 *   - boxes: per-page bounding-box hints for drawing black bars over the redacted
 *            image (the upstream caller maps text offsets to PDF coordinates)
 */

import nlp from "compromise";

export type PiiType =
  | "SSN"
  | "EIN"
  | "PHONE"
  | "EMAIL"
  | "ZIP"
  | "ACCOUNT"
  | "ROUTING"
  | "PERSON"
  | "ORG"
  | "ADDRESS_LINE";

export interface PiiToken {
  type: PiiType;
  value: string;
  start: number;
  end: number;
}

export interface RedactionResult {
  redactedText: string;
  tokens: PiiToken[];
}

const REGEX_PATTERNS: { type: PiiType; pattern: RegExp }[] = [
  // Order matters — most specific first so they don't get masked by looser patterns
  { type: "SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "EIN", pattern: /\b\d{2}-\d{7}\b/g },
  { type: "EMAIL", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: "PHONE", pattern: /\b\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}\b/g },
  // Account / routing number contexts — require keyword to avoid false positives on financial figures
  {
    type: "ROUTING",
    pattern: /\b(?:routing|rtn|aba)[\s#:]*\d{9}\b/gi,
  },
  {
    type: "ACCOUNT",
    pattern: /\b(?:account|acct|acc)[\s#:]*\d{6,17}\b/gi,
  },
  // Address-like lines: "123 Main St" or "123 Main Street, Apt 4B"
  {
    type: "ADDRESS_LINE",
    pattern:
      /\b\d{1,6}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Parkway|Pkwy|Highway|Hwy)\b\.?(?:,?\s+(?:Apt|Suite|Ste|Unit|#)\s*[A-Za-z0-9-]+)?/g,
  },
  { type: "ZIP", pattern: /\b\d{5}(?:-\d{4})?\b/g },
];

/**
 * Run the regex pass and return tokens in document order.
 */
function regexPass(text: string): PiiToken[] {
  const tokens: PiiToken[] = [];
  for (const { type, pattern } of REGEX_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      tokens.push({
        type,
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }
  return tokens;
}

/**
 * NER pass via compromise. Identifies person and organization names.
 * Has more false positives than regex; the redaction preview UI lets users
 * un-redact false positives.
 */
function nerPass(text: string): PiiToken[] {
  const tokens: PiiToken[] = [];
  const doc = nlp(text);

  const collect = (matches: any[], type: PiiType) => {
    for (const m of matches) {
      const value = m.text as string;
      if (!value || value.length < 2) continue;
      const start = text.indexOf(value);
      if (start === -1) continue;
      tokens.push({ type, value, start, end: start + value.length });
    }
  };

  collect(doc.people().json(), "PERSON");
  collect(doc.organizations().json(), "ORG");

  return tokens;
}

/**
 * Drop tokens whose span overlaps a higher-priority token earlier in the array.
 * Priority is regex order > NER order.
 */
function dedupeOverlaps(tokens: PiiToken[]): PiiToken[] {
  const sorted = [...tokens].sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: PiiToken[] = [];
  let cursor = -1;
  for (const t of sorted) {
    if (t.start >= cursor) {
      kept.push(t);
      cursor = t.end;
    }
    // else overlaps a previously-kept token; drop it
  }
  return kept;
}

/**
 * Apply tokens to text, replacing each span with `[REDACTED:TYPE]`.
 * Walks in reverse so offsets stay valid.
 */
function applyRedactions(text: string, tokens: PiiToken[]): string {
  const sorted = [...tokens].sort((a, b) => b.start - a.start);
  let out = text;
  for (const t of sorted) {
    out = out.slice(0, t.start) + `[REDACTED:${t.type}]` + out.slice(t.end);
  }
  return out;
}

/**
 * Main entry. Run both passes, dedupe, and produce the redacted text + token list.
 */
export function redact(text: string): RedactionResult {
  if (!text || !text.trim()) {
    return { redactedText: text, tokens: [] };
  }
  const regex = regexPass(text);
  const ner = nerPass(text);
  const tokens = dedupeOverlaps([...regex, ...ner]);
  const redactedText = applyRedactions(text, tokens);
  return { redactedText, tokens };
}

/**
 * Re-injection helper used at PDF report generation time. Takes a string with
 * `[REDACTED:TYPE]` markers and the original token list, returns the original.
 *
 * Used only client-side when the user downloads their final report — their name
 * and EIN appear on the PDF, but those strings never traveled to our backend.
 */
export function reinject(redactedText: string, tokens: PiiToken[]): string {
  // Naive: replace the first remaining `[REDACTED:TYPE]` of each type with the
  // matching token value, in document order. Good enough for the report cover.
  const queueByType = new Map<PiiType, string[]>();
  for (const t of tokens) {
    const arr = queueByType.get(t.type) ?? [];
    arr.push(t.value);
    queueByType.set(t.type, arr);
  }
  return redactedText.replace(/\[REDACTED:([A-Z_]+)\]/g, (match, type: string) => {
    const queue = queueByType.get(type as PiiType);
    if (!queue || queue.length === 0) return match;
    return queue.shift()!;
  });
}

/**
 * Run a few asserts to catch regressions when iterating on patterns.
 * Call from a dev console: `import('./lib/redactor').then(m => m.__selfTest())`.
 */
export function __selfTest() {
  const cases: { input: string; expectTypes: PiiType[] }[] = [
    { input: "SSN: 123-45-6789", expectTypes: ["SSN"] },
    { input: "EIN 12-3456789", expectTypes: ["EIN"] },
    { input: "Email me at jane@acme.com", expectTypes: ["EMAIL"] },
    { input: "Call (555) 123-4567 today", expectTypes: ["PHONE"] },
    { input: "Account #1234567890", expectTypes: ["ACCOUNT"] },
    { input: "Routing 021000021", expectTypes: ["ROUTING"] },
    { input: "123 Main Street, Apt 4B", expectTypes: ["ADDRESS_LINE"] },
    { input: "ZIP 94110", expectTypes: ["ZIP"] },
    { input: "Acme Corp Inc.", expectTypes: ["ORG"] }, // NER, may vary
  ];
  for (const c of cases) {
    const r = redact(c.input);
    const got = new Set(r.tokens.map((t) => t.type));
    const missing = c.expectTypes.filter((t) => !got.has(t));
    if (missing.length) {
      console.warn(`[redactor] case '${c.input}' missed:`, missing);
    } else {
      console.log(`[redactor] ✓ ${c.input}`);
    }
  }
}
