import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { putSession } from "@/lib/kv";
import { extractFromDocument } from "@/lib/prompts/document-extractor";
import type { RawIntake, Session } from "@/lib/types";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const FormSchema = z.object({
  source: z.literal("form").optional(),
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

const PdfSchema = z.object({
  source: z.literal("pdf"),
  hint: z
    .object({
      state: z.string().length(2).optional(),
      city: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  pages: z
    .array(
      z.object({
        redactedText: z.string().max(50_000),
        redactedImageDataUrl: z.string().startsWith("data:image/"),
      })
    )
    .min(1)
    .max(10),
});

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let raw: RawIntake;

  try {
    if (body.source === "pdf") {
      const parsed = PdfSchema.parse(body);
      // Stage 1a: Vision API extracts a RawIntake from the redacted document
      raw = await extractFromDocument({
        pages: parsed.pages,
        userHint: parsed.hint ?? undefined,
      });
    } else {
      raw = FormSchema.parse(body);
    }
  } catch (err: any) {
    console.error("intake input invalid:", err?.message);
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
