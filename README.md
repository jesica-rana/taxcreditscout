# TaxCreditScout

> **Find every federal, state, and local tax credit your business qualifies for — including the ones your CPA missed.**

Built for the **Build-a-Company-a-Thon** (72-hour revenue-or-bust hackathon).

The wedge: every other tool (TaxCredit.ai, Neo.Tax, MainStreet, etc.) covers **one** credit (R&D). Nobody finds R&D + WOTC + Section 179 + 50 state credits + opportunity zones in one shot. We do.

The urgency: **July 4–6, 2026** is the last day SMBs can retroactively claim R&D credits for tax years 2022–2024 under the One Big Beautiful Bill Act. ~70 days from now. After that, the money is permanently gone.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend / Backend | Next.js 14 (App Router) on Vercel | Fastest path from zero to deployed |
| Vector DB | Qdrant Cloud | Hackathon partner; semantic match between vague user inputs and credit eligibility text |
| LLM | OpenAI (GPT-5 + text-embedding-3-small) | Hackathon partner; structured extraction + agent pipeline |
| Payments | Stripe Checkout | Hosted page; no PCI; live in 30 min |
| PDF | `@react-pdf/renderer` | Render report server-side and stream as PDF |
| Email | Resend | Send report on purchase |
| Analytics | Vercel Analytics + PostHog | Track funnel; we need to optimize landing → purchase |

## Repo layout

```
.
├── README.md                       # this file
├── PLAN.md                         # 72-hour hour-by-hour build plan
├── ARCHITECTURE.md                 # system design, data flow, prompts
├── MARKETING.md                    # distribution playbook + post copy
├── SCRAPING.md                     # which sources, how to extract
├── DEPENDENCIES.md                 # accounts/keys to provision
├── .env.example
├── package.json
├── next.config.js / tsconfig / tailwind / postcss
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # root layout, fonts, analytics
│   ├── page.tsx                    # landing page
│   ├── intake/page.tsx             # 5-question form
│   ├── results/[id]/page.tsx       # blurred preview + paywall
│   ├── report/[id]/page.tsx        # full unlocked report
│   └── api/
│       ├── intake/route.ts         # runs the agent pipeline
│       ├── checkout/route.ts       # creates Stripe session
│       ├── webhook/route.ts        # Stripe webhook → unlocks report
│       └── report/[id]/pdf/route.ts # streams PDF
├── components/                     # React components
├── lib/
│   ├── openai.ts                   # OpenAI client + helpers
│   ├── qdrant.ts                   # Qdrant client + helpers
│   ├── stripe.ts
│   ├── pipeline.ts                 # the orchestrator (profile → search → verify → compose)
│   ├── types.ts                    # shared types: Credit, UserProfile, Report
│   └── prompts/                    # all LLM prompts in one place (the IP)
│       ├── credit-extractor.ts     # used by scrapers
│       ├── profile-builder.ts
│       ├── eligibility-verifier.ts
│       └── report-composer.ts
├── scripts/
│   ├── extract-credits.ts          # scrape sources → structured JSON
│   ├── embed-credits.ts            # JSON → Qdrant vectors
│   └── sources.ts                  # list of URLs to scrape
└── data/
    └── seed/
        └── sample-credits.json     # 10 hand-coded federal credits to bootstrap
```

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env template, fill in keys
cp .env.example .env.local

# 3. Seed Qdrant with sample credits (works without scraping)
npm run seed

# 4. (Optional) Scrape and load real credits
npm run scrape    # extracts ~300 credits to data/credits.json
npm run embed     # embeds + uploads to Qdrant

# 5. Run dev server
npm run dev
```

## What to read in what order

1. **PLAN.md** — the 72-hour schedule. Read this first.
2. **DEPENDENCIES.md** — what to sign up for tonight.
3. **ARCHITECTURE.md** — the agent pipeline + Qdrant schema.
4. **SCRAPING.md** — data acquisition strategy.
5. **MARKETING.md** — distribution playbook for hours 21–72.

## Hackathon partner integrations

- **OpenAI** — used for embeddings, structured extraction, and the 4-stage agent pipeline. See `lib/prompts/`.
- **Qdrant** — single collection `tax_credits`, semantic match between user activity descriptions and credit eligibility text. See `lib/qdrant.ts`.
- **Tandem** — strong candidate for embedding their AI agent on the report page to walk users through next steps with their CPA. Reach out to their booth Saturday morning.

## Disclaimer

This product is informational and **not tax advice**. All reports include a CPA-handoff disclaimer. We never auto-file, e-sign, or interact with the IRS on behalf of users. See `ARCHITECTURE.md` § "Legal posture."
