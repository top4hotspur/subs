import { NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import {
  getPlatformStripeTestCheckoutConfig,
  getPlatformStripeTestClient,
} from "@/lib/billing/platform-stripe-test-checkout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ ok: false, error: "INVALID_SESSION_ID" }, { status: 400 });
  }

  const config = getPlatformStripeTestCheckoutConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "STRIPE_PLATFORM_TEST_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const stripe = getPlatformStripeTestClient(config);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
    const lineItem = session.line_items?.data[0] ?? null;
    const price = lineItem?.price ?? null;
    const product = price && typeof price.product !== "string" ? price.product : null;
    const productName = product && "name" in product ? product.name : null;
    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        paymentStatus: session.payment_status,
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata ?? {},
        priceId: price?.id ?? null,
        productId: product?.id ?? (typeof price?.product === "string" ? price.product : null),
        productName,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "PLATFORM_STRIPE_TEST_SESSION_GET_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
