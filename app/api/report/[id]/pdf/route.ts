import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/kv";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPdf } from "@/components/ReportPdf";
import React from "react";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(params.id);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!session.paid) return NextResponse.json({ error: "locked" }, { status: 402 });

  const buffer = await renderToBuffer(
    React.createElement(ReportPdf, { report: session.report })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="taxcredit-audit-${params.id.slice(0, 8)}.pdf"`,
    },
  });
}
