"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatGbp } from "@/lib/ui/display-labels";

type Health = {
  stripeSecretKeyPresent: boolean;
  stripeSecretLooksLikeStripeSecret: boolean;
  testProductPresent: boolean;
  testProductLooksLikeStripeProductId: boolean;
  testProductMasked: string | null;
  testPricePresent: boolean;
  testPriceLooksLikeStripePriceId: boolean;
  testPriceMasked: string | null;
  configured: boolean;
  expectedEnvKeys: string[];
  checkedAt: string;
  nodeEnv: string | null;
  runtimeEnvProbe: Array<{
    key: string;
    present: boolean;
    length: number;
    startsWith?: string | null;
    looksLikeStripeSecret?: boolean;
    looksLikeStripeWebhookSecret?: boolean;
    looksLikeStripePriceId?: boolean;
    looksLikeStripeProductId?: boolean;
    masked?: string | null;
  }>;
  warnings: string[];
};

type SessionSummary = {
  id: string;
  mode: string | null;
  status: string | null;
  paymentStatus: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  paymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
  metadata: Record<string, string>;
  priceId: string | null;
  productId: string | null;
  productName: string | null;
};

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null) return "-";
  if ((currency ?? "").toLowerCase() === "gbp") return formatGbp(amount / 100);
  return `${(amount / 100).toFixed(2)} ${(currency ?? "").toUpperCase()}`;
}

export function PlatformBillingTestClient({
  checkout,
  sessionId,
}: {
  checkout?: string;
  sessionId?: string;
}) {
  const [health, setHealth] = useState<Health | null>(null);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/billing-test/checkout", { cache: "no-store" });
        const body = (await response.json()) as { ok?: boolean; health?: Health; error?: string };
        if (!cancelled && body.ok && body.health) setHealth(body.health);
      } catch {
        if (!cancelled) setMessage("Could not load platform Stripe test configuration.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      if (!sessionId) return;
      try {
        const response = await fetch(`/api/admin/billing-test/session?sessionId=${encodeURIComponent(sessionId)}`);
        const body = (await response.json()) as { ok?: boolean; session?: SessionSummary; error?: string; message?: string };
        if (cancelled) return;
        if (!response.ok || !body.ok || !body.session) {
          setMessage(body.message ?? body.error ?? "Could not retrieve Stripe session.");
          return;
        }
        setSession(body.session);
      } catch {
        if (!cancelled) setMessage("Could not retrieve Stripe session.");
      }
    }
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function startCheckout() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/billing-test/checkout", { method: "POST" });
      const body = (await response.json()) as {
        ok?: boolean;
        checkoutUrl?: string | null;
        error?: string;
        message?: string;
      };
      if (!response.ok || !body.ok || !body.checkoutUrl) {
        setMessage(body.message ?? body.error ?? "Could not start platform test checkout.");
        setLoading(false);
        return;
      }
      window.location.href = body.checkoutUrl;
    } catch {
      setMessage("Network error while starting platform test checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Platform Stripe checkout test</h2>
        <p className="mt-2 text-sm text-slate-600">
          This creates a Stripe Checkout Session on the MyExperiment.club platform Stripe account only.
          It does not use connected accounts, tenant booking checkout, or subscriber-site payment webhooks.
        </p>

        {checkout === "cancelled" ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Test checkout was cancelled. No setup request, tenant booking, or subscriber site was changed.
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
        ) : null}

        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <p className="font-semibold">Price/Product rule</p>
          <p className="mt-1">
            Stripe Checkout needs a Price ID. `STRIPE_PLATFORM_TEST_PRICE_ID` is preferred. If only
            `STRIPE_PLATFORM_TEST_PRODUCT_ID` is set, the API tries the product default price, then an active product price.
          </p>
        </div>

        <button
          type="button"
          className={`mt-4 ${primaryButtonClass}`}
          onClick={() => void startCheckout()}
          disabled={loading}
        >
          {loading ? "Starting Stripe..." : "Test platform Stripe checkout"}
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to admin
          </Link>
          <Link href="/admin/setup-requests" className={`${outlineButtonClass} ${smallButtonClass}`}>
            Setup requests
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Safe diagnostics</h2>
        {health ? (
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p><span className="font-semibold">Stripe secret present:</span> {yesNo(health.stripeSecretKeyPresent)}</p>
            <p><span className="font-semibold">Stripe secret looks valid:</span> {yesNo(health.stripeSecretLooksLikeStripeSecret)}</p>
            <p><span className="font-semibold">Test product present:</span> {yesNo(health.testProductPresent)}</p>
            <p><span className="font-semibold">Test product looks like prod_:</span> {yesNo(health.testProductLooksLikeStripeProductId)}</p>
            <p><span className="font-semibold">Test product ID:</span> {health.testProductMasked ?? "-"}</p>
            <p><span className="font-semibold">Test price present:</span> {yesNo(health.testPricePresent)}</p>
            <p><span className="font-semibold">Test price looks like price_:</span> {yesNo(health.testPriceLooksLikeStripePriceId)}</p>
            <p><span className="font-semibold">Test price ID:</span> {health.testPriceMasked ?? "-"}</p>
            <p><span className="font-semibold">Configured enough to try:</span> {yesNo(health.configured)}</p>
            <p><span className="font-semibold">Runtime checked:</span> {health.checkedAt}</p>
            <p><span className="font-semibold">Node env:</span> {health.nodeEnv ?? "-"}</p>
            <p><span className="font-semibold">Expected env keys:</span> {health.expectedEnvKeys.join(", ")}</p>
            {health.warnings.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                {health.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            ) : null}
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">Runtime env probe</p>
              <p className="mt-1 text-xs text-slate-600">
                Admin-only presence check. Secrets show presence and length only; product/price IDs are masked.
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1 pr-3">Key</th>
                      <th className="py-1 pr-3">Present</th>
                      <th className="py-1 pr-3">Length</th>
                      <th className="py-1 pr-3">Safe check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.runtimeEnvProbe.map((entry) => {
                      const safeChecks = [
                        entry.masked ? `masked ${entry.masked}` : null,
                        entry.startsWith && !entry.masked ? `starts ${entry.startsWith}` : null,
                        entry.looksLikeStripeSecret !== undefined ? `sk_: ${yesNo(entry.looksLikeStripeSecret)}` : null,
                        entry.looksLikeStripeWebhookSecret !== undefined ? `whsec_: ${yesNo(entry.looksLikeStripeWebhookSecret)}` : null,
                        entry.looksLikeStripePriceId !== undefined ? `price_: ${yesNo(entry.looksLikeStripePriceId)}` : null,
                        entry.looksLikeStripeProductId !== undefined ? `prod_: ${yesNo(entry.looksLikeStripeProductId)}` : null,
                      ].filter(Boolean).join(", ");
                      return (
                        <tr key={entry.key} className="border-t border-slate-200">
                          <td className="py-1 pr-3 font-mono text-[11px]">{entry.key}</td>
                          <td className="py-1 pr-3">{yesNo(entry.present)}</td>
                          <td className="py-1 pr-3">{entry.length}</td>
                          <td className="py-1 pr-3">{safeChecks || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Loading diagnostics...</p>
        )}
      </section>

      {checkout === "success" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold text-emerald-950">Platform test checkout returned</h2>
          <p className="mt-2 text-sm text-emerald-900">
            This page confirms the Stripe-hosted test checkout returned to platform admin. Webhooks remain the
            source of truth for real setup/subscription payments; this smoke test does not provision a site.
          </p>
          {session ? (
            <div className="mt-4 grid gap-2 text-sm text-emerald-950 sm:grid-cols-2">
              <p><span className="font-semibold">Session:</span> {session.id}</p>
              <p><span className="font-semibold">Mode:</span> {session.mode ?? "-"}</p>
              <p><span className="font-semibold">Status:</span> {session.status ?? "-"}</p>
              <p><span className="font-semibold">Payment status:</span> {session.paymentStatus ?? "-"}</p>
              <p><span className="font-semibold">Product:</span> {session.productName ?? session.productId ?? "-"}</p>
              <p><span className="font-semibold">Price:</span> {session.priceId ?? "-"}</p>
              <p><span className="font-semibold">Amount:</span> {formatAmount(session.amountTotal, session.currency)}</p>
              <p><span className="font-semibold">Subscription:</span> {session.subscriptionId ?? "-"}</p>
              <p><span className="font-semibold">Payment intent:</span> {session.paymentIntentId ?? "-"}</p>
              <p><span className="font-semibold">Purpose:</span> {session.metadata.paymentPurpose ?? "-"}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-900">Retrieving session summary...</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
