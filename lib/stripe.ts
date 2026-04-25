import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
});

export async function createCheckoutSession(args: {
  sessionId: string;
  email: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID_AUDIT!, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    customer_email: args.email ?? undefined,
    client_reference_id: args.sessionId,
    metadata: { session_id: args.sessionId },
    allow_promotion_codes: true,
  });
  return session;
}

export function verifyWebhook(body: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
