# Dependencies & Account Setup

Sign up for these **before Friday opening remarks.** Most have signup → key in <5 min, but Stripe live mode requires identity verification (~30 min) and you don't want to be doing it during launch.

---

## Critical path (must have before hour 1)

| Service | Purpose | Free tier? | Setup time |
|---------|---------|------------|------------|
| **OpenAI API** | Embeddings + LLM agent pipeline | Pay-as-you-go (~$5 credit free for new accounts) | 5 min |
| **Qdrant Cloud** | Vector DB | 1GB free tier | 5 min |
| **Vercel** | Hosting (frontend + API routes + KV store) | Free tier covers hackathon traffic | 5 min |
| **Stripe** | Payments | Free, 2.9% + $0.30 per txn | 30 min (incl. live mode) |
| **GitHub** | Code repo (Vercel auto-deploys) | Free | 2 min |
| **Domain** | `taxcreditscout.com` or similar via Namecheap or Vercel domain | $12/yr | 10 min (DNS propagation) |

## Strongly recommended (have before hour 12)

| Service | Purpose | Free tier? |
|---------|---------|------------|
| **Resend** | Send report PDFs by email | 100/day free, 3K/mo on $20 plan |
| **Vercel KV** (Upstash Redis) | Session storage, paid-status flag | 10K commands/day free |
| **PostHog** | Funnel analytics | 1M events/mo free |

## Nice to have (Saturday)

| Service | Purpose |
|---------|---------|
| **Linear** or **Notion** | Track Saturday distribution todos |
| **Buffer** or **Typefully** | Cross-post Twitter/LinkedIn from one place |
| **Loom** | Record a 60-second product demo for the landing page |
| **Calendly** | For the $249 "audit + consult" upsell — book 30-min calls |

---

## .env.local template

After signup, fill these into `.env.local` (template at `.env.example`):

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL_LLM=gpt-5
OPENAI_MODEL_EMBED=text-embedding-3-small

# Qdrant
QDRANT_URL=https://xxxxx.cloud.qdrant.io
QDRANT_API_KEY=...
QDRANT_COLLECTION=tax_credits

# Stripe (start in test mode!)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_AUDIT=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=reports@taxcreditscout.com

# Vercel KV (auto-injected by Vercel; only needed for local dev)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://taxcreditscout.com
NEXT_PUBLIC_DEADLINE_DATE=2026-07-04T23:59:59-04:00

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Stripe live-mode checklist

You can develop in test mode forever, but you can't take real money without going through:

1. Verify your business identity (SSN/EIN, bank account)
2. Add a refund policy URL in Stripe dashboard (link to your `/refund` page)
3. Add a terms of service URL
4. Set "statement descriptor" to something recognizable (`TAXCREDITSCOUT` — Stripe truncates to 22 chars)
5. Enable Apple Pay & Google Pay in Stripe dashboard for higher mobile conversion
6. Set up the webhook endpoint pointing at `https://taxcreditscout.com/api/webhook` and grab the signing secret

**Make sure your bank account is linked before Saturday.** Stripe payouts are 2 business days but the first payout requires the bank verification step (deposits 2 micro-amounts) — start this Friday morning if not earlier.

---

## Qdrant Cloud setup

1. Sign up at https://cloud.qdrant.io
2. Create a free cluster in `us-east` (lowest latency from Vercel's default region)
3. Note the cluster URL and API key
4. Create the collection (one-time, run from your terminal):

```bash
curl -X PUT "$QDRANT_URL/collections/tax_credits" \
  -H "api-key: $QDRANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    },
    "optimizers_config": { "default_segment_number": 2 }
  }'
```

Or run `npm run init-qdrant` (the package script that calls `scripts/init-qdrant.ts`).

---

## OpenAI usage limits

Default OpenAI accounts have a $100/month soft limit. **Check your usage tier** at https://platform.openai.com/settings/organization/limits — if you're on Tier 1 (just funded), you may hit rate limits during a launch spike. Increase to Tier 2 by spending $50 on the account first (you can add credits manually).

Per-audit cost is ~$0.50, so 100 audits = $50. Plan for at least $100 in OpenAI credits.

---

## Domain & DNS

Point your domain at Vercel:

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

Add the domain in Vercel project settings. SSL provisioning is automatic but takes 10–60 min — **do this Friday hour 0** so it's ready by hour 18.

For email (Resend), add these records:

```
MX    send  feedback-smtp.us-east-1.amazonses.com (priority 10)
TXT   send  "v=spf1 include:amazonses.com ~all"
TXT   resend._domainkey  (Resend gives you the value)
```

---

## Backup plan (if a service is down at launch)

| Service | Fallback |
|---------|----------|
| Stripe | Lemon Squeezy (5-min signup, similar tax handling) |
| Qdrant | In-memory `Map<id, {vector, payload}>` with brute-force cosine; works for 500 credits |
| OpenAI | Anthropic Claude (different SDK, similar JSON-mode capability) |
| Vercel | Cloudflare Pages or Netlify (Next.js works on both) |
| Resend | SendGrid free tier (100/day) |

Document this so a teammate can swap providers under pressure without thinking.

---

## Pre-flight checklist (run Friday hour 0)

- [ ] OpenAI API key works: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models | head -50`
- [ ] Qdrant cluster reachable: `curl -H "api-key: $QDRANT_API_KEY" $QDRANT_URL/collections`
- [ ] Stripe test charge works: create a test product, run a test checkout
- [ ] Vercel deploys: push to GitHub, watch the build go green
- [ ] Domain resolves to Vercel: `curl -I https://taxcreditscout.com`
- [ ] Resend can send: send a test email to yourself
- [ ] PostHog receives events: trigger a test event from your laptop

If any of these fail at hour 0, fix it BEFORE writing code. Debugging infra at hour 14 with sleep deprivation is brutal.
