import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: session.id,
    email: session.email,
    paid: session.paid,
    profile: session.profile,
    report: session.report,
    created_at: session.created_at,
    unlocked_at: session.unlocked_at,
  });
}
