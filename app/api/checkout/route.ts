import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { getSession } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "missing session" }, { status: 400 });
  }
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkout = await createCheckoutSession({
    sessionId,
    email: session.email,
    successUrl: `${baseUrl}/report/${sessionId}?paid=1`,
    cancelUrl: `${baseUrl}/results/${sessionId}`,
  });

  return NextResponse.redirect(checkout.url!, { status: 303 });
}
