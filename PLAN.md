# 72-Hour Build Plan

**Goal: Maximum revenue by Sunday EOD.**

Not "ship a polished product." Not "demo well." **Revenue.** Every decision is filtered through "does this directly produce a paying customer?"

---

## North-star metrics (track these on a whiteboard)

| Metric | Target | Why |
|--------|--------|-----|
| Visitors to landing | 2,000 | Top of funnel |
| Intake form starts | 200 (10%) | Compelling enough hero |
| Intake completions | 140 (70%) | 5 questions is the right size |
| Preview → Checkout clicks | 28 (20%) | The blurred amount has to feel real |
| Paid conversions | 14 (50%) | $99 × 14 = **$1,386** baseline |
| Stretch: 30 paid | $2,970 | What "winning" looks like |

If you can convert at 1% from cold traffic to paid, you only need 1,400 visitors for $1,400. Achievable.

---

## Friday — Hours 0–18 (build + ship MVP)

### Hours 0–1 — Provision everything

Run these account signups in parallel **before you write a line of code**:

- [ ] Qdrant Cloud cluster (free tier, 1GB enough)
- [ ] OpenAI API project + key
- [ ] Vercel project (link to a fresh GitHub repo)
- [ ] Stripe account in **test mode** first (live mode = identity verification, do that Sat morning)
- [ ] Resend account (1 sender domain)
- [ ] Domain via Vercel or Namecheap (`taxcreditscout.com` or similar — pick something defensible)
- [ ] PostHog or Vercel Analytics
- [ ] Twitter/X account if you don't have one tied to this product
- [ ] Buffer/Typefully for cross-posting

Person A: signups + Vercel + DNS. Person B: starts on scraping.

### Hours 1–4 — Data acquisition

See `SCRAPING.md` for full source list. Critical path:

1. Hand-code 10 federal credits in `data/seed/sample-credits.json` (already provided in this repo). This unblocks the entire app even if scraping fails.
2. Run `scripts/extract-credits.ts` against the 30 federal forms listed in `scripts/sources.ts`.
3. Add top 10 states (CA, TX, FL, NY, PA, IL, OH, GA, NC, NJ).
4. Add 8,764 opportunity zone tracts as a single bulk import (IRS publishes this as one CSV).
5. Run `scripts/embed-credits.ts` to push to Qdrant.

**Stop at 300 credits.** Comprehensiveness is a trap — you don't need 5,000 credits to find $14K for someone, you need the 200 highest-value ones. Quality > coverage.

### Hours 4–7 — Intake form + landing

Single Next.js page with the 5-question form. No auth, no DB for users — just generate a session ID, run pipeline, store result keyed by ID.

Design rules:
- One question per screen on mobile, all on one screen on desktop
- Progress bar
- "5 questions, 60 seconds" copy under the title
- The deadline countdown is **at the top of every page**

### Hours 7–10 — Agent pipeline

`lib/pipeline.ts` orchestrates 4 stages:

1. **Profile builder** — raw answers → structured profile + 8 search queries
2. **Vector retrieval** — for each query, top 20 from Qdrant, dedupe to ~50 candidates
3. **Eligibility verifier** — for each, GPT call returns {qualifies, confidence, estimated_credit}
4. **Report composer** — builds the final structured report

All prompts in `lib/prompts/*.ts`. Iterate on these — the prompt quality is the product.

### Hours 10–12 — Preview UI

Show:
- Total dollar amount found (NOT blurred — the big number sells)
- List of credit names (NOT blurred — proves it's real)
- Per-credit dollar amount: **blurred**
- "What to do" instructions: **blurred**
- Big "Unlock full report — $99" button

### Hours 12–15 — Stripe + PDF

- Stripe Checkout session creation
- Webhook flips a flag in Qdrant payload (or a tiny `kv` store) → unlocks
- Report page checks flag, renders blurred or unblurred
- `@react-pdf/renderer` server-side route streams a PDF
- Email the PDF via Resend on webhook

### Hours 15–18 — Landing page

Hero copy is in `MARKETING.md`. Build:
- Hero with deadline countdown
- "What we check" grid (47 federal / 200+ state / 100+ local)
- Sample report screenshot (generate a fake report, take screenshot, blur the company name)
- 3-step "how it works"
- FAQ (the legal questions are the ones that block purchase)
- Money-back guarantee badge

**Switch Stripe to live mode at hour 17.** Test one purchase end-to-end before sleep.

---

## Saturday — Hours 18–48 (launch + iterate)

### Hours 18–24 — Soft launch + first sales

Sleep 6 hours (hours 18–24). Don't skip — you'll write better copy rested.

### Hours 24–30 — Launch blast

In order, **don't skip**:
1. Personal LinkedIn post (highest-signal channel for B2B SMB founders)
2. Twitter/X thread with screenshots
3. Indie Hackers launch
4. r/smallbusiness post (rules: no link in OP, link in comments)
5. r/Entrepreneur post (different angle: deadline urgency)
6. Hacker News Show HN (only if landing is polished — otherwise wait until Sun)
7. 5 Facebook SMB groups
8. Founders Slack groups (Trends.vc, Pioneer, On Deck, MegaMaker)

See `MARKETING.md` for exact post copy.

### Hours 30–36 — Iterate on conversion

Watch PostHog. The leak is almost always one of:
- Landing → intake (hero copy wrong, deadline not urgent enough)
- Preview → checkout (blurred amounts don't feel real, price too high/low)
- Checkout → paid (Stripe error, trust signal missing)

Make ONE change at a time. If conversion improves, lock it in.

### Hours 36–42 — CPA channel

This is the secret revenue lever. Cold-DM 20 SMB-focused CPAs on LinkedIn:

> Hey [name], I built a tool that scans for tax credits across federal/state/local in 5 min. Mind if I run it on 3 of your clients free? If we find credits you missed, I'd love to white-label this for your firm.

Pricing for them: **$499/mo flat or $99 × clients audited.** This is 10× the consumer revenue per sale and they'll close fast if your free audit lands a real finding.

### Hours 42–48 — Round 2 distribution

Repeat the launch blast on different channels:
- LinkedIn comment strategy (find tax-season posts, reply, then DM)
- Quora answers on "tax credits for small business" questions
- Email outreach to 50 SMB owners scraped from local chamber-of-commerce directories
- Influencer DMs (small business / accounting Twitter)

---

## Sunday — Hours 48–72 (close + scale what works)

### Hours 48–54 — Affiliate offer

Spin up an affiliate link: **30% commission, 60-day cookie.** Post in:
- IndieHackers "show your affiliate program"
- Twitter ("anyone want to make 30% selling this for the next 90 days?")
- Reddit r/Affiliatemarketing

Affiliate revenue counts toward the hackathon total.

### Hours 54–66 — Press + content

- Submit to Product Hunt for **Monday launch** (after the hackathon, but it amplifies)
- Write a Medium/Substack post: "I scraped every tax credit in America. Here's what I learned." → drives ongoing traffic
- Submit to Hacker News if you didn't already

### Hours 66–72 — Final sales push + report quality

- Manually email everyone who started intake but didn't pay (use the session ID + an email-capture step on intake — add this Saturday morning, see "Adjustments" below)
- Manually review every report generated and improve the most common credits' eligibility text in Qdrant — better matches = higher conversions on the next cohort
- Final tally + screenshot the Stripe dashboard for the judges

---

## Saturday adjustments (likely needed)

These are predictable issues; preempt them:

1. **Add email capture to intake.** Hour 4 build was anonymous. By Saturday morning, gate the preview behind email so you have a list to remarket to.
2. **A/B test the price.** Run $79 vs $99 vs $149 for 4-hour windows. The right price is whichever has the highest revenue (not conversion rate alone).
3. **Add testimonials.** As soon as you have 3 paying customers, ask them for a one-line quote in exchange for a free annual re-audit. Add to landing page.
4. **Add live revenue ticker** to landing page ("$3,247 found for businesses today"). Social proof.

---

## Don't-do list (anti-scope)

These are tempting and they will kill you:

- ❌ User auth / accounts (sessions are enough for 72hrs)
- ❌ Database migrations (use Qdrant payloads or Vercel KV for the unlock flag, that's it)
- ❌ Mobile-native app
- ❌ Polished onboarding flow (you have 5 questions, not 50)
- ❌ Admin dashboard (read Stripe + PostHog directly)
- ❌ A/B testing framework (manually swap copy and watch the funnel)
- ❌ "Save your report for later" (email it)
- ❌ Trying to scrape all 50 states perfectly (10 states cover 60% of SMBs)
- ❌ Custom CMS for the landing page (write it as `app/page.tsx`)
- ❌ Building a CPA portal (a Google Form is enough for 72hrs of CPA outreach)

---

## Risk list (what to watch for)

| Risk | Mitigation |
|------|------------|
| OpenAI rate-limit during launch spike | Use `gpt-5` with retries; pre-cache common queries |
| Stripe disputes from "this isn't tax advice" | Disclaimer everywhere; refund instantly on any complaint |
| Bad eligibility matches embarrass us | Verifier confidence threshold ≥ 0.6; add "we'll re-audit free if a credit was wrong" |
| Reddit bans the launch post | Post organically first, link in comments only after engagement |
| Site goes down at peak traffic | Vercel scales automatically; Qdrant Cloud handles 1000 RPS on free tier |
| Hackathon judges question whether revenue is "real" | Stripe dashboard screenshot + bank statement = irrefutable |
