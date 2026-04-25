# Architecture

## Privacy posture (the wedge)

**Your tax return never leaves your browser.**

The defining architectural property of this product: PDFs are parsed client-side, PII is redacted client-side, and only de-identified text + a redacted page image leave the user's device. The user's name, SSN, EIN, address, phone number, email, and bank account numbers are stored only in browser memory (and the final report PDF the user downloads), never in our database, never in OpenAI logs, never in Vercel logs.

We *do* see: financial line items (wages, R&D expenses, equipment purchases, health insurance premiums, hiring counts). Those are exactly the inputs we need to find credits. We *don't* see: who any of those numbers belong to.

This is enforced by topology, not policy. The redaction happens before the network boundary.

## System diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (privacy boundary)                                      │
│                                                                  │
│  app/intake/page.tsx                                             │
│    ┌────────────┐    ┌──────────────┐    ┌─────────────────┐    │
│    │ PDF upload │ ─► │ pdfjs-dist   │ ─► │ lib/redactor.ts │    │
│    └────────────┘    │ text + image │    │ regex + NER     │    │
│                      └──────────────┘    └────────┬────────┘    │
│                                                   │             │
│    ┌──────────────────────────────────────────────▼──────────┐  │
│    │ components/RedactionPreview.tsx                         │  │
│    │   - shows every redacted token                          │  │
│    │   - user reviews + approves                             │  │
│    │   - PII tokens kept in browser memory ONLY              │  │
│    └──────────────────────────────┬───────────────────────────┘ │
│                                   │ (only redacted text + img)  │
└───────────────────────────────────┼─────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js App Router)                                     │
│                                                                  │
│  app/api/intake → runs the pipeline:                             │
│    1. Vision API extracts profile from redacted image            │
│    2. Profile-builder produces 8 search queries                  │
│    3. Qdrant retrieves ~50 credit candidates                     │
│    4. Verifier filters to ~7 with confidence ≥ 0.6               │
│    5. Composer produces the structured Report                    │
│                                                                  │
│  app/api/checkout → Stripe session                               │
│  app/api/webhook  → Stripe webhook → marks paid                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │ OpenAI │ │ Qdrant │ │ Stripe │
   └────────┘ └────────┘ └────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Vercel KV    │
            │ session:{id} │
            │ NO PII       │
            └──────────────┘
```

We use Vercel KV (or Upstash Redis) as the only server-side state store. Each intake produces a session ID, and we stash `{profile, report, paid}` keyed by that ID. **The session record contains NO PII** — only redacted financials and inferred attributes. No user accounts. Reports auto-expire after 90 days.

When the user downloads their final PDF report, the browser re-injects their PII (name, business name, EIN) onto the cover page. That re-injection happens entirely in the client at PDF render time.

---

## Data model

### Qdrant collection: `tax_credits`

One point per credit. Vector dimension: 1536 (text-embedding-3-small).

**Embedding text** (what gets vectorized):
```
{name}. {jurisdiction} credit for {industries}. {eligibility_text}.
Who qualifies: {plain_language_qualifies}.
```

**Payload schema:**

```ts
{
  id: string,                     // "wotc_federal" | "ca_research_credit" | ...
  name: string,
  jurisdiction: "Federal" | "State" | "City" | "Private",
  state: string | null,           // "CA" | null
  city: string | null,
  credit_amount_min: number,
  credit_amount_max: number,
  credit_type: "per_employee" | "percent_of_expense" | "flat" | "percent_of_revenue",
  industries: string[],           // ["all"] or specific NAICS-ish tags
  company_size_min_employees: number,
  company_size_max_employees: number | null,
  revenue_min: number | null,
  revenue_max: number | null,
  form: string,                   // "IRS Form 5884"
  filing_deadline: string,        // "with annual return" | "Form 8850 within 28 days"
  deadline_critical: boolean,
  deadline_date: string | null,   // ISO; null if rolling
  eligibility_text: string,       // full IRS plain-language description
  documentation_required: string[],
  url: string,
  estimated_avg_finding: number,  // for the executive summary math
  source_authority: "irs.gov" | "state_dor" | "city" | "tax_foundation" | ...
}
```

### Vercel KV: `session:{id}`

```ts
{
  id: string,
  email: string | null,
  profile: UserProfile,
  raw_answers: object,
  report: Report,
  paid: boolean,
  stripe_session_id: string | null,
  created_at: string,
  unlocked_at: string | null
}
```

### `UserProfile` (built by the Profile Builder agent)

```ts
{
  business_description: string,
  state: string,
  city: string | null,
  employee_count: number,
  revenue_band: "under_500k" | "500k_2m" | "2m_10m" | "10m_50m" | "over_50m",
  activities: string[],          // multi-select normalized tags
  free_text: string | null,
  derived_queries: string[],     // 8 enriched search queries the LLM generates
  industries: string[]           // inferred from description
}
```

---

## Browser-side PDF & redaction pipeline

This runs entirely in the user's browser before anything hits the network.

### Stage 0a — PDF parsing (`lib/pdf-parser.ts`)

- `pdfjs-dist` extracts text content (preserving page + position)
- For each page, render to `<canvas>` at 2× scale → produce a base64 PNG data URL
- Output: `{ pages: { text, imageDataUrl }[] }`

### Stage 0b — Redaction (`lib/redactor.ts`)

Targeted regex passes for high-confidence PII:
- SSN: `\b\d{3}-\d{2}-\d{4}\b`
- EIN: `\b\d{2}-\d{7}\b`
- Phone: variants of `\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}`
- Email: standard RFC pattern
- ZIP: `\b\d{5}(-\d{4})?\b`
- Bank account: digit runs of 8–17 prefixed by ACCT/ACCOUNT
- Routing: 9-digit runs prefixed by RTN/ROUTING

Then `compromise` (~150KB) runs NER for:
- Person names
- Organization names

Each redacted span produces a `PiiToken { type, value, start, end, page }`. The redactor returns:
- `redactedPages: { text, imageDataUrl }[]` — text with `[REDACTED:SSN]` style markers; image with black-bar overlays at PII bounding boxes
- `tokens: PiiToken[]` — kept in browser memory ONLY for re-injection at report time

### Stage 0c — Redaction preview (`components/RedactionPreview.tsx`)

The trust UI. Shows the redacted image side-by-side with a list of every redacted token (type + position). User can:
- Click any kept text to manually mark it as PII
- Click any redaction to un-redact (false positive)
- Tick "I've reviewed the redactions" to enable the submit button

Only after this gate do we POST to `/api/intake` with `{ redactedPages, sessionId }`. PII tokens stay client-side.

---

## The agent pipeline

`lib/pipeline.ts` chains 5 stages (1 new + the original 4). All stages are JSON-mode OpenAI calls so we never parse free text.

### Stage 1a — Document extractor (PDF path only) (`lib/prompts/document-extractor.ts`)

**Input:** redacted page images (base64 PNGs)
**Output:** structured `RawIntake` (same shape as the form path)
**Model:** GPT-4o vision; JSON mode

Vision reads the redacted page image and extracts: industry signal, employee count, revenue band, line items related to wages / equipment / health insurance / R&D / hiring. It cannot extract PII because PII is already covered by black bars.

If the user came in via the form path, this stage is skipped. Either way, the next stage gets a `RawIntake`.

### Stage 1b — Profile Builder

**Input:** `RawIntake` (5 fields)
**Output:** `UserProfile` with `derived_queries` (8 short search queries)
**Model:** `gpt-5` (or whatever they have); JSON mode
**Why this stage:** users can't write good vector queries. We need to translate "we hired 3 people, bought a forklift, did some R&D" into 8 distinct semantic queries that hit different parts of the corpus.

### Stage 2 — Vector Retrieval

**Input:** `derived_queries`
**Output:** ~50 candidate credits (deduped union of top-20 per query)
**Filters applied:**
- `jurisdiction == "Federal"` OR `state == profile.state`
- `employee_count >= company_size_min_employees`
- `employee_count <= company_size_max_employees` (if set)
- `industries` overlaps `profile.industries` OR `industries == ["all"]`

This is a Qdrant filter on payload + cosine similarity on vector. ~150ms total.

### Stage 3 — Eligibility Verifier

**Input:** profile + each candidate's full payload
**Output:** `{qualifies: "yes" | "likely" | "no", confidence: 0..1, estimated_credit: number, reasoning: string, what_to_verify: string[]}`
**Model:** `gpt-5`; JSON mode; one call per candidate (parallelized with `Promise.all`, batches of 10)
**Filter:** keep `qualifies in ["yes", "likely"]` AND `confidence >= 0.6`

This is the most expensive stage (~50 OpenAI calls per intake). Cost: ~$0.40 per audit. Acceptable at $99 price.

### Stage 4 — Report Composer

**Input:** profile + verified credits
**Output:** structured `Report` object (executive summary + per-credit sections + action plan + CPA handoff)
**Model:** `gpt-5`; JSON mode

The `Report` object is rendered two ways:
- Web (`app/report/[id]/page.tsx`) — interactive, can re-run questions
- PDF (`app/api/report/[id]/pdf/route.ts`) — `@react-pdf/renderer`, downloadable

---

## Why Qdrant earns its keep (the "magic moment")

Keyword search fails on this domain because users describe activities in everyday language:

| User says | Keyword matches | Vector matches |
|-----------|----------------|----------------|
| "we hired three people who were on food stamps" | nothing | **WOTC** (eligibility text mentions "SNAP recipients") |
| "we put solar panels on the roof" | "solar" | **Investment Tax Credit + state solar incentive + utility rebate** |
| "we built our own software" | "software" | **R&D Credit + Section 174** (eligibility text mentions "qualified research expenses including software development") |

The semantic gap between user language and credit eligibility text is the entire reason this product needs a vector DB. It's not a feature — it's the product.

---

## Pricing & monetization model

| Tier | Price | Includes |
|------|-------|----------|
| Audit | $99 | 12-page PDF report + email delivery |
| Audit + Consult | $249 | Above + 30-min Zoom call (you, on a video call, walking them through it) |
| Firm license | $499/mo | Unlimited audits, white-labeled, for CPAs |

**Money-back guarantee:** "If we find less than $1,000 in credits, full refund." Almost every business qualifies for >$1K, so this is psychologically free.

**Refund policy:** 100% refund for 7 days, no questions. Kills chargeback risk and Stripe stays happy.

---

## Legal posture

This is critical. Read carefully.

1. **Not tax advice.** Disclaimer on landing page, in checkout, in PDF, in email. The phrase: *"This report is informational and not tax advice. Verify all credits with a qualified CPA before filing."*
2. **Don't auto-file.** We never submit to the IRS. We never e-sign forms. We never act as a preparer. Crossing that line triggers Circular 230 and we'd need EAs/CPAs on staff.
3. **Don't promise specific dollars.** Always use ranges and "estimated." Phrasing: *"Your estimated finding: $5,000–$8,000"* not *"You will save $7,000."*
4. **Source attribution.** Every credit cites the IRS form or state authority. We're a search index over public data; we're not making claims.
5. **Refund unhappy customers immediately.** No fight, no friction. Cheaper than a chargeback, kills bad reviews.
6. **No fabricated testimonials.** Real or empty. Sample reports use fictional businesses clearly labeled "Sample Business, Inc."

---

## Performance & cost

Per audit:
- 1× Profile Builder call (~500 input tokens, 400 output) → ~$0.02
- 50× Eligibility Verifier calls (~800 in, 200 out each) → ~$0.40
- 1× Report Composer call (~3K in, 2K out) → ~$0.06
- 8× embedding calls for queries → ~$0.0001
- ~50× Qdrant searches → free tier
- **Total OpenAI cost per audit: ~$0.50**
- **Margin per $99 sale: ~$96** after Stripe fees

End-to-end latency target: **30 seconds** from "submit" to "preview ready." Show a live progress UI ("Building your profile... Searching 312 credits... Verifying matches... Composing report...") because a 30s wait feels long without feedback.
