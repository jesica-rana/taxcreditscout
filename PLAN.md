# 24-Hour Build Plan (Privacy-First Pivot)

**Goal: Maximum revenue by Sunday EOD.**

The wedge is now **privacy.** Every other tool in this space (TaxCredit.ai, Neo.Tax, MainStreet, Instead.com) uploads your raw tax return to their servers. We don't. Your PDF never leaves your browser. Only redacted, de-identified text touches our pipeline.

That's a clean differentiator that lands on a landing page in 8 words: **"We never see your SSN. Period."**

---

## North-star metrics

| Metric | Target | Why |
|--------|--------|-----|
| Visitors | 2,000 | Top of funnel |
| PDF upload starts | 200 (10%) | Compelling hero |
| Redaction approval | 180 (90%) | Preview must build trust |
| Preview → Checkout | 36 (20%) | Blurred amounts feel real |
| Paid conversions | 18 (50%) | $99 × 18 = **$1,782** |
| Stretch: 30 paid | $2,970 | Winning |

---

## The 24-hour build (revised)

| Hours | Task | Notes |
|-------|------|-------|
| 0–1 | Setup | Same as v1 — provision Qdrant, OpenAI, Stripe, Vercel, domain |
| 1–4 | Scrape 300 credits → Qdrant | Same as v1 — see SCRAPING.md |
| **4–7** | **PDF.js + browser-side redaction (regex + simple NER)** | **The new core.** PII never leaves the browser. |
| **7–9** | **Redaction preview UI (show what's being stripped)** | **The trust signal.** Users SEE every redacted token before sending. |
| **9–12** | **Vision API on redacted PDF + agent pipeline** | Vision reads the redacted page image; pipeline runs same as v1 |
| 12–15 | Free preview + paywall + report | Same as v1 |
| 15–18 | Stripe + report PDF (PII re-injected client-side) | The user's name goes back on their PDF, never via our server |
| **18–21** | **Landing page emphasizing privacy-first** | **New angle.** "We never see your SSN" is the hero |
| **21–24** | **Distribution focused on "we never see your SSN"** | **New hook.** Privacy fear is a strong purchase driver |

---

## Hour-by-hour

### Hours 0–1 — Provision

Run signups in parallel. See `DEPENDENCIES.md`.

### Hours 1–4 — Data acquisition

Hand-coded sample credits unblock the demo immediately (`npm run seed`). Run `npm run scrape && npm run embed` in parallel with the rest of the build.

### Hours 4–7 — Browser-side redaction (THE NEW CORE)

This is the differentiator. Stack:

- **`pdfjs-dist`** — parses PDFs in the browser, extracts text + renders pages to canvas
- **`lib/redactor.ts`** — regex patterns for SSN / EIN / phone / email / addresses / account numbers, plus `compromise` for name/organization NER
- **Targeted redaction:** strip identifiers, **keep financials and line items.** Those are exactly what we need to find credits.

Output of this stage:
- `redactedText: string` — the PDF's text content with PII replaced by `[REDACTED:SSN]` etc.
- `redactedImageDataUrl: string` — page rendered with black bars over PII regions (for Vision API)
- `piiTokens: { type, value, position }[]` — kept in browser memory only, used to re-inject into the final report PDF

### Hours 7–9 — Redaction preview UI

The trust UI. Show the redacted text + the image with black bars. Highlight every token being removed. Let the user click an item to **un-redact** if false positive (rare but builds confidence). Big "Send to analysis" button stays disabled until they tick "I've reviewed the redactions."

This is the conversion moment. If it doesn't feel safe, they bounce.

### Hours 9–12 — Vision API + agent pipeline

- Send the redacted page image to GPT-4o vision with a JSON-schema prompt that extracts: industry, employee count, revenue, line items related to wages/equipment/health insurance/R&D/hiring activity
- Result becomes a `UserProfile` (same shape as the form path)
- Hand off to the existing 4-stage pipeline (profile → retrieval → verifier → composer)

### Hours 12–15 — Preview + paywall + report

Same as v1. The blurred preview / Stripe Checkout / unlocked report flow already works for the form path; the PDF path produces the same `Session` shape, so this layer is unchanged.

### Hours 15–18 — Stripe + PDF with PII re-injection

When generating the final PDF report, the client passes the stored PII tokens back so the user's PDF says "Tax Credit Audit for Acme Corp, EIN 12-3456789" — but those strings never traveled to our backend. Re-injection happens in the browser via `@react-pdf/renderer`.

### Hours 18–21 — Landing page (privacy-first)

New hero copy in MARKETING.md. Three trust elements:

1. Big lock icon + "Your tax return never leaves your browser"
2. Animated demo: PDF upload → redactions appearing → only redacted text shipping out
3. "How is this different from [competitor]" section that names names

### Hours 21–24 — Distribution

Privacy-fear posts hit different on:
- r/smallbusiness — "I built a tax credit tool that doesn't see your SSN. Here's how."
- LinkedIn — security-conscious founders share this
- Hacker News — "Show HN: client-side PII redaction for tax credit discovery"
- CPA channel — CPAs love privacy stories because they get sued over data leaks

---

## Why the privacy angle is sharper than v1

1. **Lower buying friction.** The biggest objection to "AI tax tools" is "you'll see my SSN." Removing that objection is a 2x conversion lift.
2. **Defensible.** Competitors can't quickly retrofit client-side processing — it requires re-architecting their entire pipeline.
3. **Marketing-native.** "We never see your SSN" is shareable. "We find credits" is not.
4. **Hacker News and Show HN bait.** Client-side ML/privacy stories get massive HN traction.
5. **CPA channel.** CPAs sell us harder when they can tell their clients "their tool is more private than us."

---

## Don't-do list (anti-scope)

Same as v1, plus:

- ❌ Server-side OCR (defeats the privacy promise)
- ❌ Storing the unredacted PDF anywhere (defeats the privacy promise)
- ❌ A "save my upload for later" feature (defeats the privacy promise — be aggressive about this)
- ❌ Custom NER model training (use `compromise` + regex, ship)
- ❌ Audit-trail UI ("show me what you sent" beyond the redaction preview is overkill)
- ❌ Fancy redaction animations (clean overlay is enough)

---

## Risk list

| Risk | Mitigation |
|------|------------|
| `pdfjs-dist` bundle size (~500KB) | Lazy-load on intake page only, not landing |
| `compromise` misses a name (false negative) | Show user the redaction preview; let them click any text to manually redact |
| Vision API cost ($0.01/image) | One image per PDF page; caps cost at ~$0.05 per audit |
| User uploads a non-tax-form PDF (an invoice, a Word export) | Vision API extracts whatever it can; the verifier filters; if no credits found we refund |
| Scanned-image PDF with no extractable text | Render page → Vision API works on images regardless |
| User trusts us less than they should and won't upload | Form fallback always available; offer both paths |
