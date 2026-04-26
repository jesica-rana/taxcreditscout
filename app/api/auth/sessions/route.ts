import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listSessionsByUser } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const sessions = await listSessionsByUser(user.id);

  // Return summary fields only — keeps payload small and avoids leaking PII
  // (the redacted RawIntake stays on the server unless explicitly requested).
  const summaries = sessions.map((s) => ({
    id: s.id,
    created_at: s.created_at,
    paid: s.paid,
    unlocked_at: s.unlocked_at,
    business_summary: s.report?.business_summary ?? "",
    state: s.raw?.state ?? null,
    employee_count: s.raw?.employee_count ?? null,
    total_estimated_low: s.report?.total_estimated_low ?? 0,
    total_estimated_high: s.report?.total_estimated_high ?? 0,
    credits_found:
      (s.report?.federal?.length ?? 0) +
      (s.report?.state?.length ?? 0) +
      (s.report?.local?.length ?? 0),
  }));

  return NextResponse.json({ sessions: summaries });
}
