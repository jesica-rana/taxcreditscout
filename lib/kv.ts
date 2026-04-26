import type { Session } from "./types";

// In-memory session store. Lost on process restart — fine for hackathon dev.
// Attached to globalThis so Next.js hot-reload doesn't wipe it.
// Swap for Vercel KV / Upstash Redis before deploying to production.
const g = globalThis as unknown as { __sessionStore?: Map<string, Session> };
const store: Map<string, Session> = g.__sessionStore ?? new Map();
g.__sessionStore = store;

export async function putSession(session: Session): Promise<void> {
  store.set(session.id, session);
}

export async function getSession(id: string): Promise<Session | null> {
  return store.get(id) ?? null;
}

export async function markPaid(
  id: string,
  stripeSessionId: string
): Promise<Session | null> {
  const s = await getSession(id);
  if (!s) return null;
  s.paid = true;
  s.stripe_session_id = stripeSessionId;
  s.unlocked_at = new Date().toISOString();
  await putSession(s);
  return s;
}
