import { NextRequest, NextResponse } from "next/server";
import { putSession, getSession } from "@/lib/kv";
import type { Report, Session, RawIntake, UserProfile } from "@/lib/types";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

// Upsert a session given an already-rendered Report. Used by the frontend
// when the original intake produced a synthetic/offline report and the user
// clicks "Send me the report" — Stripe + the webhook PDF mailer need a real
// session in KV to key off of.
export async function POST(req: NextRequest) {
  let body: {
    session_id?: string;
    email?: string;
    report?: Report;
    profile?: UserProfile;
    raw?: RawIntake;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.report || !body.email) {
    return NextResponse.json(
      { error: "report and email are required" },
      { status: 400 }
    );
  }

  const id =
    body.session_id && !body.session_id.startsWith("local-")
      ? body.session_id
      : randomUUID();

  const existing = await getSession(id);
  const session: Session = existing
    ? { ...existing, email: body.email, report: body.report }
    : {
        id,
        user_id: null,
        email: body.email,
        raw: body.raw ?? emptyRaw(body.email),
        profile: body.profile ?? emptyProfile(body.raw),
        report: body.report,
        paid: false,
        stripe_session_id: null,
        created_at: new Date().toISOString(),
        unlocked_at: null,
      };

  await putSession(session);
  return NextResponse.json({ session_id: id });
}

function emptyRaw(email: string): RawIntake {
  return {
    business_description: "",
    state: "",
    city: null,
    employee_count: 0,
    revenue_band: "500k_2m",
    activities: [],
    free_text: null,
    email,
  };
}

function emptyProfile(raw?: RawIntake): UserProfile {
  return {
    business_description: raw?.business_description ?? "",
    state: raw?.state ?? "",
    city: raw?.city ?? null,
    employee_count: raw?.employee_count ?? 0,
    revenue_band: raw?.revenue_band ?? "500k_2m",
    activities: raw?.activities ?? [],
    free_text: raw?.free_text ?? null,
    industries: [],
    derived_queries: [],
  };
}
