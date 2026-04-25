import { kv } from "@vercel/kv";
import type { Session } from "./types";

const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

export async function putSession(session: Session): Promise<void> {
  await kv.set(`session:${session.id}`, session, { ex: TTL_SECONDS });
}

export async function getSession(id: string): Promise<Session | null> {
  const s = await kv.get<Session>(`session:${id}`);
  return s ?? null;
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
