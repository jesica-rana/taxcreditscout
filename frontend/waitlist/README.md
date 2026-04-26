# CreditBowl waitlist

Standalone waitlist landing page + Supabase backend. Real Postgres database, Row Level Security so submitted emails stay private to you, deploy the HTML anywhere.

## Files

```
waitlist/
├── index.html             ← the landing page
├── supabase-schema.sql    ← run once in Supabase SQL editor
├── assets/
│   └── creditbowl-logo.svg
├── favicon.svg
├── vercel.json            ← (optional) standalone Vercel deploy
└── README.md              ← this file
```

## How it works

1. Visitor submits their email on `index.html`
2. JS sends a `POST` to your Supabase REST endpoint (`/rest/v1/waitlist`)
3. Postgres inserts a row in the `public.waitlist` table
4. **Row Level Security** rejects any read attempt from the public anon key — only INSERTs are allowed
5. You read the list inside Supabase Studio (Table Editor) — that's your dashboard

---

## One-time setup (~5 minutes)

### 1. Create the table

1. Open your Supabase project → **SQL Editor** → **+ New query**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run**. You'll see "Success. No rows returned."

This creates `public.waitlist`, enables RLS, and adds an INSERT-only policy for the anonymous role.

### 2. Get your project URL + anon key

1. Project Settings (gear icon) → **API**
2. Copy:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon public** key — long JWT starting `eyJ…`

### 3. Wire it into the HTML

Open `index.html` in this folder. Find these two lines near the bottom:

```js
const SUPABASE_URL  = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON = 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE';
```

Paste your values. Save.

### 4. Test it

1. Open `index.html` in your browser
2. Submit a test email
3. Open Supabase → **Table Editor** → **waitlist** → your row appears immediately

If nothing shows up, open the browser console — Supabase returns an error message in the response body that explains why (most often: schema not run, RLS not configured, or wrong key).

---

## Privacy posture

| | Visible to | Notes |
|---|---|---|
| **Submitted emails** | **Only you** in Supabase Studio | Reads blocked by RLS for the anon role |
| **Supabase URL + anon key** (in the HTML bundle) | Anyone who views source | Safe — can only INSERT, not SELECT |
| **The Postgres database** | Only you (project owner) | Behind Supabase auth |
| **userAgent / IP / browser fingerprint** | **Not collected** | We only store `email`, `source`, `created_at` |

### Why the anon key is safe to expose

The anon key authenticates as the `anon` Postgres role. The schema's RLS policy says:

```sql
create policy waitlist_anon_insert on public.waitlist
  for insert to anon
  with check (...);
```

There is **no** `for select` policy for `anon`, which means SELECT is denied by default. Anyone can submit — nobody can read.

Verify: try it yourself after deploying:

```bash
curl "$SUPABASE_URL/rest/v1/waitlist?select=email" \
  -H "apikey: $SUPABASE_ANON" \
  -H "Authorization: Bearer $SUPABASE_ANON"
# Returns: []
```

Empty array. Even though the key is valid, RLS blocks the read.

### Anti-spam options when you need them

- **Honeypot field** — add a hidden input to the form, reject submissions where it's filled
- **Email-shape stricter check** — already in the schema (3–254 chars, must contain `@`)
- **Cloudflare Turnstile** (free, invisible) — add a token check via a Postgres function
- **Rate limit by IP** — Supabase Edge Function in front of the insert

---

## Deploy the page

```bash
cd waitlist
npx vercel --prod
```

Or drag the folder onto Netlify, commit + GitHub Pages, etc. It's one HTML file with one font CDN and one image — works anywhere.

---

## Reading the list later

**Supabase Studio** → Table Editor → `waitlist` → sort by `created_at desc`.

To export: Studio's "Download CSV" button. Or run in SQL editor:

```sql
select email, source, created_at from public.waitlist order by created_at;
```

To send launch broadcast: copy emails, paste into Resend / Loops / Mailchimp. Or use `pg_dump` for a real export.

---

## Troubleshooting

**`401 Unauthorized` on submit**
- Check that you copied the **anon public** key (not the service_role)
- Make sure you ran the schema SQL (especially the `enable row level security` and `create policy` lines)

**`409 Conflict` on submit**
- Email is already on the list. The HTML treats this as success — your visitor still sees the position card. The dedup is working.

**Schema didn't apply**
- Run each block separately in the SQL editor to find which one failed
- The `gen_random_uuid()` function needs the `pgcrypto` extension; Supabase has it enabled by default

**Want to add columns?**
- Add to the schema (`alter table public.waitlist add column ...`) and update the body of the `fetch` in `index.html` to include the new field
