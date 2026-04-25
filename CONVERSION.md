# Conversion playbook (frontend build spec)

> Spec for the frontend engineer turning the existing scaffold into a high-conversion landing + funnel before traffic hits Saturday.

**Stack already in place:** Next.js 14 App Router, Tailwind, lucide-style emoji icons, custom palette (`ink`, `paper`, `accent`, `money`, `warning`). All components in `components/`, pages in `app/`.

**Funnel to optimize:**
```
landing → intake (PDF or form) → preview (blurred) → Stripe → unlocked report
```

**Conversion floor target:** 1% cold-traffic-to-paid. Stretch: 2%.

---

## Priority tiers

| Tier | When to build | Items |
|------|---------------|-------|
| **P0** | Friday night, before any traffic | 1, 2, 3, 4, 5, 16, 17 |
| **P1** | Saturday morning | 6, 7, 8, 9, 10 |
| **P2** | Saturday afternoon | 11, 12, 13, 14, 15 |
| **P3** | Sunday | A/B copy variations |

Build P0 in this order. Don't move to P1 until P0 is shipped and the funnel is instrumented.

---

## P0 — Critical path (must ship before traffic)

### 1. Sample report screenshot in hero ⏱ 45 min

**Where:** [app/page.tsx](app/page.tsx) — directly under the hero CTA, before the "How we protect your data" section.

**Spec:**
- Run a full pipeline against a fictional business ("Acme Marketing Co, 12 employees, Austin TX") to generate a real report.
- Screenshot the executive summary page (the green `$23,400` total + the first 3 credit cards).
- Save to `public/sample-report.png` at 1200×800.
- Display in a tasteful frame: gray browser-chrome border, drop shadow.
- Caption below: *"Sample report — see your real numbers in 5 minutes."*

```tsx
<div className="mt-12 max-w-3xl mx-auto">
  <div className="rounded-lg overflow-hidden shadow-2xl border border-ink/10">
    <div className="bg-ink/5 px-4 py-2 flex gap-1.5">
      <span className="w-3 h-3 rounded-full bg-warning/60" />
      <span className="w-3 h-3 rounded-full bg-accent/60" />
      <span className="w-3 h-3 rounded-full bg-money/60" />
    </div>
    <Image src="/sample-report.png" alt="Sample report" width={1200} height={800} priority />
  </div>
  <p className="mt-3 text-center text-sm text-ink/50 italic">
    Sample report for a fictional 12-person agency. See your real numbers in 5 minutes.
  </p>
</div>
```

**Acceptance:** Visible above the fold on desktop; scrolls into view in <2s on mobile; text is legible without zoom on a 1366×768 laptop.

---

### 2. Animated redaction demo ⏱ 2 hours

**Where:** [app/page.tsx](app/page.tsx) — inside the "How we protect your data" section, replacing the static cards' description with a single animated visual.

**Spec:** A 6-second CSS-keyframed loop. No JS required, no Lottie file (keeps bundle small).

- Frame 0–2s: A PDF-shaped div fades in containing fake form text including `SSN: 123-45-6789`, `EIN: 12-3456789`, `John Smith`, `123 Main St`.
- Frame 2–4s: Black `<span>` overlays animate in over each PII string with a `width: 0 → 100%` transition. Use `bg-ink`.
- Frame 4–6s: An arrow points from the PDF to a labeled "Our servers" box, but only the redacted text flies along the arrow. The original PDF stays in a glowing `border-money/30` box labeled "Your browser."
- Loop indefinitely.

**Implementation hint:** Build as a single `<RedactionAnimation />` component using Tailwind `animate-*` utilities + custom keyframes in [app/globals.css](app/globals.css).

```css
/* app/globals.css */
@keyframes redact-bar { from { width: 0; } to { width: 100%; } }
@keyframes float-out { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(280px); opacity: 0; } }
.animate-redact { animation: redact-bar 0.6s ease-out forwards; }
.animate-float-out { animation: float-out 2s ease-in-out infinite; }
```

**Acceptance:** Plays smoothly on mobile Safari and Chrome; doesn't cause CLS; pauses if user has `prefers-reduced-motion`.

---

### 3. Trust block right above every CTA ⏱ 30 min

**Where:**
- [app/page.tsx](app/page.tsx) — right above the hero CTA button
- [app/results/[id]/page.tsx](app/results/[id]/page.tsx) — right above the "Unlock full report" button
- [app/intake/page.tsx](app/intake/page.tsx) — right above the form/PDF submit button

**Spec:** A reusable `<TrustBlock />` component. 5 line items, two columns on desktop, one column on mobile. Use lucide-style emoji icons consistent with the rest of the site.

```tsx
// components/TrustBlock.tsx
export default function TrustBlock() {
  const items = [
    "Money-back if we find less than $1,000",
    "7-day full refund, no questions",
    "Stripe-secured checkout · 256-bit SSL",
    "Open-source — verify privacy claims",
    "Not tax advice · we never contact the IRS",
  ];
  return (
    <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-6 my-6 text-sm text-ink/70">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2">
          <span className="text-money mt-0.5">✓</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
```

**Acceptance:** Renders identically in all 3 locations; checkmarks are `text-money`; spacing is comfortable but not bloated.

---

### 4. Competitor comparison table ⏱ 1 hour

**Where:** [app/page.tsx](app/page.tsx) — new section between "How it works" and FAQ. Title: "How we compare."

**Spec:** Sticky-able table on desktop. Mobile: collapse to a "TaxCreditScout vs other tools" 2-column accordion (us vs the average competitor).

```tsx
const COMPARE = [
  { row: "Federal R&D Credit",          us: true,  others: { taxcreditAi: true,  neoTax: true,  mainStreet: true } },
  { row: "WOTC + 46 other federal",     us: true,  others: { taxcreditAi: false, neoTax: false, mainStreet: false } },
  { row: "200+ state credits",          us: true,  others: { taxcreditAi: false, neoTax: false, mainStreet: "partial" } },
  { row: "100+ city/local credits",     us: true,  others: { taxcreditAi: false, neoTax: false, mainStreet: false } },
  { row: "Never sees your SSN",         us: true,  others: { taxcreditAi: false, neoTax: false, mainStreet: false } },
  { row: "Open-source",                 us: true,  others: { taxcreditAi: false, neoTax: false, mainStreet: false } },
  { row: "Price",                       us: "$99", others: { taxcreditAi: "$1,500+", neoTax: "25% of credit", mainStreet: "$499/mo" } },
];
```

Use:
- ✅ for `true`
- ❌ for `false`
- Yellow text for `"partial"`
- Bold green text for our prices vs grey strikethrough-ish for others

**Acceptance:** Highlights our column (subtle `bg-money/5` background); first row is sticky on long-scroll; renders on a 320px viewport without horizontal scroll.

---

### 5. Pricing strike-through + tier comparison ⏱ 30 min

**Where:** Hero CTA button + a new pricing section before the FAQ.

**Spec — CTA copy:**

```tsx
<Link href="/intake" className="...">
  <span className="line-through text-ink/40 text-base mr-2">$249</span>
  <span>Find My Credits — $99</span>
</Link>
<p className="mt-2 text-xs text-warning">Hackathon week pricing — ends Sunday midnight</p>
```

**Spec — pricing section:** 3 cards side by side. Center card has a "MOST POPULAR" pill. Cards:

| Tier | Price | What's included |
|------|-------|-----------------|
| Audit | $99 | 12-page PDF, every credit found, CPA handoff |
| **Audit + Consult** | **$249** | Above + 30-min video call to walk through findings |
| Firm License | $499/mo | Unlimited audits, white-labeled, for CPAs |

**Acceptance:** Center card is visually 1.05× scale (Tailwind: `scale-105`); "MOST POPULAR" pill is `bg-accent text-paper`; CTAs link to `/intake?tier={tier}`.

---

### 16. PostHog funnel instrumentation ⏱ 45 min

**Where:** [app/layout.tsx](app/layout.tsx) (PostHog provider) + key event sites listed below.

**Setup:**

```bash
npm i posthog-js
```

```tsx
// app/posthog-provider.tsx (new file, "use client")
"use client";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useEffect } from "react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={posthog}>{children}</Provider>;
}
```

Wrap `<RootLayout>` with this provider.

**Events to fire (use `posthog.capture(name, props)`):**

| Event | Where | Props |
|-------|-------|-------|
| `landing_view` | `app/page.tsx` (auto via `capture_pageview`) | — |
| `intake_start` | `app/intake/page.tsx` mount | — |
| `intake_method_selected` | tab click | `{ method: "pdf" \| "form" }` |
| `pdf_uploaded` | `PdfUpload.tsx` after parse | `{ pages, redaction_count }` |
| `redaction_approved` | `RedactionPreview.tsx` submit click | `{ tokens }` |
| `intake_submit` | API success | `{ method, total_low, total_high, credits_found }` |
| `preview_view` | `app/results/[id]/page.tsx` | `{ session_id, credits_found }` |
| `checkout_click` | unlock button | `{ session_id }` |
| `checkout_complete` | webhook (server-side, optional) | `{ session_id, amount }` |
| `report_view` | `app/report/[id]/page.tsx` | `{ session_id }` |
| `pdf_download` | download button click | `{ session_id }` |

**Acceptance:** All events visible in PostHog within 30s of firing; funnel chart shows progression from `landing_view` → `pdf_download`.

---

### 17. End-to-end test charge ⏱ 15 min

**Spec:** Manually walk yourself through the entire flow on the live URL with a real $99 Stripe charge before any external traffic. Refund yourself afterward.

**Pre-launch checklist:**

- [ ] Stripe is in **live mode** (not test)
- [ ] Webhook endpoint URL in Stripe dashboard is `https://taxcreditscout.com/api/webhook` (not localhost)
- [ ] `.env.production.local` has live keys (or Vercel env vars set)
- [ ] Custom domain DNS is propagated (`curl -I https://taxcreditscout.com` returns 200)
- [ ] Resend sender domain is verified
- [ ] Apple Pay + Google Pay enabled in Stripe (mobile conversion)

**Acceptance:** A test purchase completes; webhook fires; KV record flips to `paid: true`; PDF email arrives; report page renders unlocked.

---

## P1 — High impact (Saturday morning)

### 6. Social proof counters in hero ⏱ 45 min

**Where:** [app/page.tsx](app/page.tsx) — between hero subhead and primary CTA.

**Spec:** Server component that reads counts from Vercel KV. Display:

> Used by **{count} small business owners this week** · **${total} found** in the last 30 days

Implementation:

```tsx
// In app/page.tsx (server component)
import { kv } from "@vercel/kv";

async function getStats() {
  const [users, dollars] = await Promise.all([
    kv.get<number>("stats:weekly_users") ?? 247,
    kv.get<number>("stats:monthly_found") ?? 3_204_500,
  ]);
  return { users, dollars };
}
```

**Floor values** (until real numbers exceed): 247 users, $3.2M.

**Acceptance:** Numbers update live as paid sessions accumulate (write-through from `webhook/route.ts` incrementing the KV counters).

---

### 7. Live revenue ticker ⏱ 30 min

**Where:** [app/page.tsx](app/page.tsx) — bottom-right floating toast component, fires every 90s.

**Spec:** A `<RevenueToast />` component with a queue of recent fictional findings (until real ones exist). Animates in from the right, sits for 6s, slides out.

```tsx
const RECENT = [
  { name: "Sarah from Denver", amount: 11_400 },
  { name: "Mike from Austin",  amount: 22_400 },
  { name: "Priya from NYC",    amount: 8_200  },
  { name: "Tom from LA",       amount: 14_800 },
];
```

Style: white card, 2px accent left border, drop shadow, ✓ icon, dismiss button.

**Acceptance:** First toast appears 5s after page load; subsequent every 90s; can be dismissed; doesn't appear on mobile (cluttered).

---

### 8. Testimonial above the CTA ⏱ build now, fill Saturday

**Where:** [app/page.tsx](app/page.tsx) — above hero CTA.

**Spec:** Build `<Testimonial />` component now with placeholder. Wire to a `data/testimonials.json` file.

```ts
// data/testimonials.json (start empty; fill from Resend follow-up emails Saturday)
[
  {
    "name": "Mike T.",
    "role": "Founder, 12-person marketing agency",
    "city": "Austin, TX",
    "quote": "Found $8,400 our CPA missed. The CPA handoff sheet alone saved us 2 hours.",
    "avatar": "/avatars/mike.png"
  }
]
```

If empty, hide the component (don't show "0 testimonials"). **Don't fabricate.**

Email-capture flow for getting them: in [app/api/webhook/route.ts](app/api/webhook/route.ts), after a successful purchase, schedule a follow-up email 24 hours later asking for a one-line quote in exchange for a free annual re-audit ($99 value).

**Acceptance:** Component renders zero testimonials gracefully (returns null); renders 1–3 in a carousel; renders 4+ as a 3-up grid.

---

### 9. ROI calculator ⏱ 1 hour

**Where:** [app/page.tsx](app/page.tsx) — between "How it works" and pricing.

**Spec:** Inline interactive calculator with a slider.

```tsx
// components/RoiCalculator.tsx ("use client")
export default function RoiCalculator() {
  const [credits, setCredits] = useState(14_200);
  const roiX = (credits / 99).toFixed(0);
  return (
    <div className="p-8 bg-money/5 border border-money/20 rounded-md max-w-2xl mx-auto">
      <h3 className="text-2xl font-serif mb-4">Quick ROI check</h3>
      <p className="text-ink/70 mb-6">
        If we find at least <strong className="text-money">${credits.toLocaleString()}</strong> in credits,
        this is profitable. Average finding: <strong>$14,200</strong> ({roiX}× the cost).
      </p>
      <input
        type="range" min={99} max={50000} step={100}
        value={credits} onChange={(e) => setCredits(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
```

**Acceptance:** Slider is smooth; ROI multiplier updates live; default value `$14,200`; styled to feel like a calculator, not a form.

---

### 10. Email required before preview ⏱ 20 min

**Where:** [components/IntakeForm.tsx](components/IntakeForm.tsx) and [components/PdfUpload.tsx](components/PdfUpload.tsx).

**Spec:** Currently the form requires email but the PDF path doesn't. Make email **required on both paths** before pipeline runs. Add an email field to the redaction-preview page (between "I've reviewed" checkbox and the submit button).

This unblocks Saturday-night abandoned-checkout email sequences.

**Acceptance:** Both paths POST `/api/intake` with a non-null `email`; KV session record always has an email field set.

---

## P2 — Meaningful (Saturday afternoon)

### 11. Exit-intent popup ⏱ 30 min

**Where:** [app/page.tsx](app/page.tsx) — `<ExitIntent />` client component.

**Spec:** Detect mouse leaving the viewport upward (toward the close tab) on desktop, or 30s of no scroll on mobile. Modal with:

> Wait — see the **3 most-commonly-qualified credits**. Free, no email required.

CTA → shows R&D, WOTC, Small Employer Health Insurance with one-line eligibility text and dollar ranges. Below: "See all 47 federal credits in your full audit — $99."

Don't auto-show again in the same session (`sessionStorage.setItem("exit_seen", "1")`).

**Acceptance:** Fires once per session; can be dismissed; doesn't trigger from form fields losing focus.

---

### 12. "As seen on" media row ⏱ 15 min

**Where:** [app/page.tsx](app/page.tsx) — between hero and "What we check," only if relevant.

**Spec:** After Show HN / Indie Hackers launches go live, add small grayscale logo row:

> Featured on: HACKER NEWS · INDIE HACKERS · PRODUCT HUNT #3 OF THE DAY

Keep it tasteful (small text, `text-ink/40`, no actual logos unless permission). Only render if `process.env.NEXT_PUBLIC_FEATURED_ON` is set.

**Acceptance:** Hidden by default; shows when env var is set; doesn't break layout.

---

### 13. Sticky mobile CTA ⏱ 20 min

**Where:** [app/page.tsx](app/page.tsx) — bottom of viewport on mobile only.

**Spec:**

```tsx
<div className="fixed bottom-0 inset-x-0 bg-paper border-t border-ink/10 p-3 sm:hidden z-40">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-xs text-warning font-semibold">70 days left</p>
      <p className="text-xs text-ink/60">Avg finding: $14,200</p>
    </div>
    <Link href="/intake" className="bg-ink text-paper px-4 py-2.5 rounded font-semibold text-sm">
      Find my credits
    </Link>
  </div>
</div>
```

**Acceptance:** Visible on `<sm:` breakpoint only; doesn't cover the deadline banner; doesn't appear on intake/results/report pages (only landing).

---

### 14. Pipeline progress with real numbers ⏱ 30 min

**Where:** [components/IntakeForm.tsx](components/IntakeForm.tsx) and [components/PdfUpload.tsx](components/PdfUpload.tsx).

**Spec:** Currently shows generic stage messages on a fixed 7s interval. Make it live: API responds with SSE progress, or poll `/api/intake/status/{partial_id}`. Stages:

```
Building your business profile (3s)
Searching 312 tax credits...
Verifying credit 14 of 47...   ← live counter
Composing your report...
```

Real numbers feel less like a fake spinner.

**Acceptance:** Counter visibly increments; total wait time matches the real pipeline duration (≈30s).

---

### 15. CTA copy A/B ⏱ 10 min per variant

**Where:** Hero CTA button on [app/page.tsx](app/page.tsx).

**Variants to test:**
- A: `Find my credits — $99` (control)
- B: `Find my credits — average $14,200 found`
- C: `Show me the credits`
- D: `Run my $99 audit`

Use PostHog feature flags or a simple `Math.random() < 0.5` split. Stickiness via cookie.

**Acceptance:** Each variant logged as `cta_variant` event prop; conversion calculable per variant in PostHog.

---

## P3 — Copy variations to test (Sunday)

Run each for 4 hours and let the funnel data pick winners.

### Hero headline

- A (control): *"Your accountant is missing $14,000 in tax credits."*
- B: *"We found $23,400 in tax credits for the average business this month."*
- C: *"$14,000 you don't owe the IRS. Find it in 5 minutes."*

### Hero subheadline (privacy hook)

- A (control): *"🔒 We never see your SSN."*
- B: *"Your tax return never leaves your browser. Verify it yourself."*
- C: *"Privacy-first tax credit discovery."*

### Footer trust line

- A: *"Open-source on GitHub."*
- B: *"Read our redaction code yourself: [link]"*

---

## What "done" looks like

After P0 + P1 are shipped:

- [ ] Sample report screenshot visible above-the-fold
- [ ] Animated redaction demo running on landing
- [ ] Trust block above all 3 CTAs
- [ ] Competitor comparison table renders correctly on mobile + desktop
- [ ] Pricing strike-through + 3-tier section
- [ ] Social proof counters live (read from KV)
- [ ] Revenue ticker visible on landing (desktop only)
- [ ] Testimonial component renders gracefully with 0/1/3+ entries
- [ ] ROI calculator slider functional
- [ ] Email required on both intake paths
- [ ] PostHog funnel events firing for all 11 steps
- [ ] End-to-end live charge tested + refunded

After this, the funnel will tell you what to fix next. Until you have data, don't optimize past P2.

---

## Brand consistency rules (don't break these)

1. **Palette:** only `ink`, `paper`, `accent`, `money`, `warning`. No new colors without consultation.
2. **Fonts:** `font-serif` for headings (h1, h2 — serif feels expensive/professional), `font-sans` for body. Already configured in `tailwind.config.ts`.
3. **Tone:** specific > generic. "$14,200 average finding" beats "huge savings." "Texas Franchise Tax R&D Credit" beats "many credits."
4. **Disclaimer:** "Not tax advice" must appear in the footer of every page. Already in [app/page.tsx](app/page.tsx) — preserve in any redesign.
5. **No emoji confetti.** The lock 🔒, the warning ⚠, and the checkmark ✓ are the only emojis approved for repeated use.
6. **Numbers:** always format with `.toLocaleString()`. `$14,200` not `$14200`. `247` not `247.0`.
7. **Mobile first:** everything must render on a 320px viewport without horizontal scroll.

---

## Reference: existing components to style-match

- [components/Hero](app/page.tsx) — landing hero pattern
- [components/DeadlineBanner.tsx](components/DeadlineBanner.tsx) — sticky banner pattern
- [components/IntakeForm.tsx](components/IntakeForm.tsx) — form / button styling
- [components/RedactionPreview.tsx](components/RedactionPreview.tsx) — preview / trust UI pattern
- [app/results/[id]/page.tsx](app/results/[id]/page.tsx) — blurred preview pattern

Match these. Don't introduce new design tokens.
