import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(200),
  ref: z.string().max(200).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
});

const KV_KEY = "waitlist";        // SET of all emails
const KV_LIST_KEY = "waitlist:order"; // LIST of {email, at, ref, source} for export

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }
  let parsed;
  try {
    parsed = Body.parse(body);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid input", details: err?.errors },
      { status: 400, headers: cors }
    );
  }

  const email = parsed.email.toLowerCase().trim();
  const at = new Date().toISOString();
  const entry = { email, at, ref: parsed.ref ?? null, source: parsed.source ?? "waitlist" };

  let position = 28; // honest base for our private beta

  // === Write 1: Vercel KV — for position counter + admin export ===
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      // Add to dedup set; SADD returns 1 if newly added
      const added = await kv.sadd(KV_KEY, email);
      if (added) {
        await kv.rpush(KV_LIST_KEY, entry);
      }
      // Position = base + total unique signups
      const total = await kv.scard(KV_KEY);
      position = 28 + Number(total);
    } catch (err) {
      console.error("KV write failed:", err);
    }
  }

  // === Write 2: Resend Audiences — for the actual mailing list ===
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    try {
      const res = await fetch(
        `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, unsubscribed: false }),
        }
      );
      if (!res.ok && res.status !== 409 /* already exists */) {
        const text = await res.text();
        console.error("Resend Audiences add failed:", res.status, text);
      }
    } catch (err) {
      console.error("Resend Audiences network error:", err);
    }
  }

  return NextResponse.json(
    { ok: true, position, total_spots: 100 },
    { status: 200, headers: cors }
  );
}

// === GET — admin export of all emails (gate with a secret in prod) ===
export async function GET(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get("key");
  if (!process.env.WAITLIST_ADMIN_KEY || auth !== process.env.WAITLIST_ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: cors });
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const list = await kv.lrange(KV_LIST_KEY, 0, -1);
      return NextResponse.json({ count: list.length, entries: list }, { headers: cors });
    } catch (err) {
      return NextResponse.json({ error: "kv read failed" }, { status: 500, headers: cors });
    }
  }
  return NextResponse.json({ error: "no kv configured" }, { status: 503, headers: cors });
}
