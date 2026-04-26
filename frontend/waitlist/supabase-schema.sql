-- ============================================================
-- CreditBowl waitlist — Supabase schema
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- It creates the table, enables Row Level Security, and writes one
-- INSERT-only policy so anonymous visitors can sign up but cannot read
-- the list. Only your authenticated dashboard sessions can read it.
-- ============================================================

-- 1. Table
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text default 'waitlist',
  created_at  timestamptz not null default now()
);

-- Case-insensitive unique constraint on email (so capitalised dupes still dedupe)
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

-- 2. Lock the table down with Row Level Security
alter table public.waitlist enable row level security;

-- 3. Allow anonymous INSERTs only (with a basic email-shape check).
--    No SELECT, UPDATE, or DELETE policy exists for anon → those are blocked.
drop policy if exists waitlist_anon_insert on public.waitlist;
create policy waitlist_anon_insert
  on public.waitlist
  for insert
  to anon
  with check (
    char_length(email) between 3 and 254
    and position('@' in email) > 0
  );

-- 4. (Optional) authenticated users — your dashboard role — can read.
--    Supabase Studio uses the service_role key which bypasses RLS,
--    so you don't strictly need this. Add only if you also have
--    an authenticated app role that should read.
-- drop policy if exists waitlist_auth_read on public.waitlist;
-- create policy waitlist_auth_read
--   on public.waitlist
--   for select
--   to authenticated
--   using (true);

-- ============================================================
-- After running this:
--   - Visit Table Editor → public.waitlist : the table is empty
--   - Visit Project Settings → API : copy the Project URL + anon public key
--   - Paste both into waitlist/index.html
-- ============================================================

-- Sanity check (run after a few signups):
-- select count(*) from public.waitlist;
-- select * from public.waitlist order by created_at desc limit 20;
