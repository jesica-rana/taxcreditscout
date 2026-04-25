import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/stripe";
import { markPaid, getSession } from "@/lib/kv";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  let event;
  try {
    event = verifyWebhook(body, signature);
  } catch (err) {
    console.error("webhook signature failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const stripeSession = event.data.object as {
      id: string;
      client_reference_id?: string;
      customer_email?: string;
      metadata?: Record<string, string>;
    };
    const ourSessionId =
      stripeSession.metadata?.session_id || stripeSession.client_reference_id;
    if (!ourSessionId) {
      return NextResponse.json({ error: "no session id" }, { status: 400 });
    }

    const updated = await markPaid(ourSessionId, stripeSession.id);

    // Email the report (best effort)
    if (process.env.RESEND_API_KEY && stripeSession.customer_email && updated) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taxcreditscout.com";
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "reports@taxcreditscout.com",
          to: stripeSession.customer_email,
          subject: `Your tax credit audit: $${updated.report.total_estimated_low.toLocaleString()}–$${updated.report.total_estimated_high.toLocaleString()} found`,
          html: `<p>Your full report is ready:</p>
                 <p><a href="${baseUrl}/report/${ourSessionId}">View your report</a></p>
                 <p><a href="${baseUrl}/api/report/${ourSessionId}/pdf">Download PDF</a></p>
                 <p>Take this to your CPA. Need help? Reply to this email.</p>
                 <p style="color:#888;font-size:11px;margin-top:24px">This report is informational and not tax advice.</p>`,
        });
      } catch (err) {
        console.error("email send failed", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
