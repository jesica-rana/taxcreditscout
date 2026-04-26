/**
 * Browser-side PII redaction.
 *
 *   1. High-confidence regex (SSN, EIN, phone, email, ZIP, account, routing, addresses)
 *   2. NER via `compromise` for person and organization names
 *
 * Redacts identifiers but KEEPS financial line items — those are what the
 * credit-matching pipeline needs.
 *
 * `redact(text)` returns:
 *   - redactedText: original text with [REDACTED:TYPE] markers
 *   - tokens: original PII values + offsets (kept in browser memory ONLY for
 *             optional re-injection at PDF download time; never sent to the network)
 *
 * Ported verbatim from taxcreditscout/lib/redactor.ts (Jesica's pivot 3ef68f0).
 */

import nlp from 'compromise'

const REGEX_PATTERNS = [
  { type: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'EIN', pattern: /\b\d{2}-\d{7}\b/g },
  { type: 'EMAIL', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: 'PHONE', pattern: /\b\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { type: 'ROUTING', pattern: /\b(?:routing|rtn|aba)[\s#:]*\d{9}\b/gi },
  { type: 'ACCOUNT', pattern: /\b(?:account|acct|acc)[\s#:]*\d{6,17}\b/gi },
  {
    type: 'ADDRESS_LINE',
    pattern:
      /\b\d{1,6}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Parkway|Pkwy|Highway|Hwy)\b\.?(?:,?\s+(?:Apt|Suite|Ste|Unit|#)\s*[A-Za-z0-9-]+)?/g,
  },
  { type: 'ZIP', pattern: /\b\d{5}(?:-\d{4})?\b/g },
]

export const PII_TYPE_LABELS = {
  SSN: 'Social Security Number',
  EIN: 'Employer ID Number',
  PHONE: 'Phone number',
  EMAIL: 'Email address',
  ZIP: 'ZIP code',
  ACCOUNT: 'Account number',
  ROUTING: 'Routing number',
  PERSON: 'Person name',
  ORG: 'Organization name',
  ADDRESS_LINE: 'Street address',
}

function regexPass(text) {
  const tokens = []
  for (const { type, pattern } of REGEX_PATTERNS) {
    pattern.lastIndex = 0
    let m
    while ((m = pattern.exec(text)) !== null) {
      tokens.push({ type, value: m[0], start: m.index, end: m.index + m[0].length })
    }
  }
  return tokens
}

function nerPass(text) {
  const tokens = []
  const doc = nlp(text)

  const collect = (matches, type) => {
    for (const m of matches) {
      const value = m.text
      if (!value || value.length < 2) continue
      const start = text.indexOf(value)
      if (start === -1) continue
      tokens.push({ type, value, start, end: start + value.length })
    }
  }

  collect(doc.people().json(), 'PERSON')
  collect(doc.organizations().json(), 'ORG')
  return tokens
}

function dedupeOverlaps(tokens) {
  const sorted = [...tokens].sort((a, b) => a.start - b.start || b.end - a.end)
  const kept = []
  let cursor = -1
  for (const t of sorted) {
    if (t.start >= cursor) {
      kept.push(t)
      cursor = t.end
    }
  }
  return kept
}

function applyRedactions(text, tokens) {
  const sorted = [...tokens].sort((a, b) => b.start - a.start)
  let out = text
  for (const t of sorted) {
    out = out.slice(0, t.start) + `[REDACTED:${t.type}]` + out.slice(t.end)
  }
  return out
}

export function redact(text) {
  if (!text || !text.trim()) return { redactedText: text, tokens: [] }
  const regex = regexPass(text)
  const ner = nerPass(text)
  const tokens = dedupeOverlaps([...regex, ...ner])
  const redactedText = applyRedactions(text, tokens)
  return { redactedText, tokens }
}

export function reinject(redactedText, tokens) {
  const queueByType = new Map()
  for (const t of tokens) {
    const arr = queueByType.get(t.type) ?? []
    arr.push(t.value)
    queueByType.set(t.type, arr)
  }
  return redactedText.replace(/\[REDACTED:([A-Z_]+)\]/g, (match, type) => {
    const queue = queueByType.get(type)
    if (!queue || queue.length === 0) return match
    return queue.shift()
  })
}
