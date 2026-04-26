# Routes & deployment map

Single Vercel deploy serves both the React SPA and the standalone waitlist page.

## Public URLs

| Path             | Component / file                       | Purpose                                         |
|------------------|----------------------------------------|-------------------------------------------------|
| **Marketing**    |                                        |                                                 |
| `/`              | `src/pages/Landing.jsx`                | Main landing — hero, redactor, bowl, atlas, etc. |
| `/welcome`       | `src/pages/Walkthrough.jsx`            | Scroll walkthrough (also `/about`)              |
| `/waitlist`      | `public/waitlist/index.html`           | Standalone waitlist (no React, Supabase-backed) |
| **Product flow** |                                        |                                                 |
| `/quiz`          | `src/pages/Quiz.jsx`                   | 5-question intake form                          |
| `/upload`        | `src/pages/Upload.jsx`                 | PDF upload + browser-side redaction             |
| `/loading`       | `src/pages/Loading.jsx`                | 4-agent pipeline running                        |
| `/preview/:id`   | `src/pages/Preview.jsx`                | Blurred report preview (paywall)                |
| `/results/:id`   | `src/pages/Results.jsx`                | Full unlocked report                            |
| `/report/:id`    | `src/pages/Results.jsx`                | Alias for results (legacy)                      |
| **Account**      |                                        |                                                 |
| `/login`         | `src/pages/Login.jsx`                  | Sign in (also `/signin`, `/signup`)             |
| `/dashboard`     | `src/pages/Dashboard.jsx`              | Authenticated home (also `/app`)                |
| **Legal**        |                                        |                                                 |
| `/terms`         | `src/pages/Terms.jsx`                  | Terms & Conditions                              |
| `/privacy`       | `src/pages/Privacy.jsx`                | Privacy Policy                                  |
| **Catch-all**    | redirect to `/`                        | Bad URLs go home                                |

## Backend API (separate Next.js app at repo root)

The Next.js API in `~/Documents/taxcreditscout/app/api/` serves these endpoints. Vite dev proxies `/api/*` to `http://localhost:3000`.

| Endpoint                         | File                                    | Purpose                              |
|----------------------------------|-----------------------------------------|--------------------------------------|
| `POST /api/intake`               | `app/api/intake/route.ts`               | Run 4-agent pipeline                 |
| `POST /api/waitlist`             | `app/api/waitlist/route.ts`             | Optional KV/Resend waitlist (unused for the standalone page; that one talks to Supabase directly) |
| `GET  /api/checkout`             | `app/api/checkout/route.ts`             | Stripe Checkout redirect             |
| `POST /api/webhook`              | `app/api/webhook/route.ts`              | Stripe webhook → unlock report       |
| `GET  /api/report/[id]/pdf`      | `app/api/report/[id]/pdf/route.ts`      | Stream the PDF report                |

## Deployment

### Single Vercel project (recommended)

```bash
cd frontend
npx vercel@latest --prod
```

Vercel auto-detects Vite from `vercel.json`. The `public/waitlist/` folder is bundled into the build output, so `/waitlist` is served as a static HTML page on the same domain.

The `vercel.json` rewrites:
- `/waitlist` and `/waitlist/` → `/waitlist/index.html` (static)
- Everything else (except paths starting with `waitlist`) → `/index.html` (SPA fallback for client-side routing)

### Backend deployed separately (Vercel Functions)

The Next.js API routes need their own deploy from the repo root. Same Vercel project can host both if you set up monorepo settings; or deploy as a separate Vercel project at `creditbowl.com/api`.

## Pre-deploy checklist

- [ ] `frontend/waitlist/index.html` and `public/waitlist/index.html` have your real Supabase URL + anon key (NOT the placeholder)
- [ ] `frontend/waitlist/supabase-schema.sql` has been run in your Supabase project
- [ ] Supabase RLS policy is enabled (test with `curl` — should return `[]` for SELECT)
- [ ] `npm run build` passes from `frontend/`
- [ ] `npm run lint` clean

## Funnel

```
                                                                 (waitlist signup)
        Marketing                                                       │
        ─────────                                                       ▼
        /  Landing  ───────►  /welcome (walkthrough)  ───────►  /waitlist
                              │
                              ▼
        Product flow
        ────────────
        /quiz (5 questions)         OR        /upload (PDF)
              │                                    │
              └──────────►  /loading  ◄────────────┘
                                │
                                ▼
                            /preview/:id  ───►  /results/:id
                                │ (paywall)         │
                                ▼                   ▼
                            Stripe checkout    Full report + PDF download
```
