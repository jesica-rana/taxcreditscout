import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { putSession } from "@/lib/kv";
import type { RawIntake, Session } from "@/lib/types";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RawSchema = z.object({
  business_description: z.string().min(5).max(500),
  state: z.string().length(2),
  city: z.string().nullable(),
  employee_count: z.number().int().min(0).max(100000),
  revenue_band: z.enum([
    "under_500k",
    "500k_2m",
    "2m_10m",
    "10m_50m",
    "over_50m",
  ]),
  activities: z.array(z.string()).max(20),
  free_text: z.string().nullable(),
  email: z.string().email().nullable(),
});

export async function POST(req: NextRequest) {
  let raw: RawIntake;
  try {
    const body = await req.json();
    raw = RawSchema.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sessionId = randomUUID();
  try {
    const result = await runPipeline({ sessionId, raw });
    const session: Session = {
      id: sessionId,
      email: raw.email,
      raw,
      profile: result.profile,
      report: result.report,
      paid: false,
      stripe_session_id: null,
      created_at: new Date().toISOString(),
      unlocked_at: null,
    };
    await putSession(session);
    return NextResponse.json({
      session_id: sessionId,
      total_low: result.report.total_estimated_low,
      total_high: result.report.total_estimated_high,
      credits_found: result.verified.length,
      timing_ms: result.timing_ms,
    });
  } catch (err) {
    console.error("pipeline error", err);
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}
