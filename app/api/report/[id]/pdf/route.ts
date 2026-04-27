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
  // TODO: re-enable `if (!session.paid) return 402` once Stripe checkout
  // is the gate for this endpoint. For now we hand the PDF back directly
  // so the user's "Send me the report" click can produce an immediate
  // browser download.

  // `renderToBuffer` accepts a Document element; React.createElement here is
  // typed too loosely for TS strict mode, so we cast through `any`.
  const element = React.createElement(ReportPdf, { report: session.report });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  // Convert Buffer → Uint8Array so `NextResponse` accepts it as a BodyInit.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="taxcredit-audit-${params.id.slice(0, 8)}.pdf"`,
    },
  });
}
