"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";
import { setupStatusDescription } from "@/lib/setup/status";
import {
  getLocalSetupRequest,
  listLocalSetupRequests,
} from "@/lib/setup/local-setup-requests";
import { LocalSetupRequest } from "@/lib/sites/types";
import { DomainOption } from "@/lib/sites/types";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui/button-styles";
import {
  domainOptionDescription,
  domainOptionLabel,
  formatGbp,
} from "@/lib/ui/display-labels";
import { getSetupRequestFromBackend } from "@/lib/setup/setup-request-backend-client";
import { createSetupCheckoutSession } from "@/lib/setup/setup-request-backend-client";
import { listWebsiteTemplates } from "@/lib/sites/mock-repository";
import {
  mapBackendSetupRequestToDisplay,
  mapLocalSetupRequestToDisplay,
  SetupRequestDisplay,
} from "@/lib/setup/setup-request-mappers";

type RequestSourceHint = "backend" | "local" | "unknown";
type CheckoutState = "success" | "cancelled" | null;

function formatWebsiteTypeLabel(templateSlug: string): string {
  const template = listWebsiteTemplates().find((item) => item.slug === templateSlug);
  if (template) {
    return template.name.replace(/\s+websites?$/i, " website");
  }
  return templateSlug.charAt(0).toUpperCase() + templateSlug.slice(1);
}

function readParamsFromLocation(): {
  requestId: string | null;
  source: RequestSourceHint;
  token: string | null;
  checkout: CheckoutState;
} {
  if (typeof window === "undefined") {
    return { requestId: null, source: "unknown", token: null, checkout: null };
  }
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  const token = params.get("token");
  const checkoutParam = params.get("checkout");
  const checkout: CheckoutState =
    checkoutParam === "success" || checkoutParam === "cancelled" ? checkoutParam : null;
  const sourceParam = params.get("source");
  if (sourceParam === "backend") {
    return { requestId, source: "backend", token, checkout };
  }
  if (sourceParam === "local") {
    return { requestId, source: "local", token, checkout };
  }
  return { requestId, source: "unknown", token, checkout };
}

export default function SetupConfirmationPage() {
  const [{ requestId, source, token, checkout }] = useState(() => readParamsFromLocation());
  const [request, setRequest] = useState<SetupRequestDisplay | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentRequests] = useState<LocalSetupRequest[]>(() =>
    typeof window === "undefined" ? [] : listLocalSetupRequests().slice(0, 5),
  );
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!requestId) {
        if (!cancelled) {
          setRequest(null);
          setLoading(false);
        }
        return;
      }
      const safeRequestId = requestId;
      const safeToken = token?.trim() || "";

      const local = getLocalSetupRequest(safeRequestId);
      const localMapped = local ? mapLocalSetupRequestToDisplay(local) : null;

      async function fetchBackend() {
        const backendResult = await getSetupRequestFromBackend(safeRequestId, safeToken || undefined);
        if (backendResult.ok) {
          return mapBackendSetupRequestToDisplay(backendResult.setupRequest);
        }
        if (source === "backend") {
          if (!safeToken) {
            if (!cancelled) {
              setVerificationError("We could not verify this setup confirmation link.");
            }
          } else if (backendResult.status === 403 || backendResult.status === 404) {
            if (!cancelled) {
              setVerificationError("We could not verify this setup confirmation link.");
            }
          }
        }
        return null;
      }

      let resolved: SetupRequestDisplay | null = null;

      if (source === "backend") {
        resolved = await fetchBackend();
      } else if (source === "local") {
        resolved = localMapped ?? (await fetchBackend());
      } else {
        resolved = localMapped ?? (await fetchBackend());
      }

      if (!cancelled) {
        setRequest(resolved);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [requestId, source, token]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Loading order...</h1>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Setup request not found</h1>
          <p className="mt-3 text-slate-600">
            {verificationError ??
              "We could not load that order. If you opened an older link, please place your order again."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/setup/barbers" className={primaryButtonClass}>Order now</Link>
            <Link href="/contact" className={outlineButtonClass}>Contact us</Link>
            <Link href="/" className={outlineButtonClass}>Back to homepage</Link>
          </div>
          {recentRequests.length > 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Recent setup requests found in this browser</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {recentRequests.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/setup/confirmation?requestId=${encodeURIComponent(item.id)}&source=local`}
                      className="text-sky-700 hover:text-sky-900"
                    >
                      {item.businessName} ({item.templateSlug}) - {formatGbp(item.setupTotalGbp)} setup
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  const showContinuePayment = request.source === "backend" && request.paymentStatus !== "PAID";
  const isPaidState =
    checkout === "success" ||
    request.paymentStatus === "PAID" ||
    request.paymentStatus === "SUBSCRIPTION_ACTIVE";
  const paymentStatusLabel =
    request.paymentStatus ??
    (checkout === "success"
      ? "PAYMENT_CONFIRMING"
      : checkout === "cancelled"
        ? "PAYMENT_NOT_COMPLETED"
        : undefined);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-emerald-900">Order received</h1>
        {checkout === "success" ? (
          <p className="mt-3 text-emerald-800">
            {request.paymentStatus === "PAID" || request.paymentStatus === "SUBSCRIPTION_ACTIVE"
              ? "Thanks — your order has been received and your payment is complete. We’ll now start preparing your website setup."
              : "Thanks — your order has been received. We’re confirming your payment status and will start preparing your website setup shortly."}
          </p>
        ) : checkout === "cancelled" ? (
          <p className="mt-3 text-amber-900">
            Payment was not completed. Your order details are saved and you can continue to secure payment.
          </p>
        ) : (
          <p className="mt-3 text-emerald-800">
            {request.source === "backend" ? "Order details saved." : "Order reference created."}
          </p>
        )}
        {paymentStatusLabel ? (
          <p className="mt-2 text-sm font-semibold text-emerald-900">Payment status: {paymentStatusLabel}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Website type:</span> {formatWebsiteTypeLabel(request.templateSlug)}</p>
            <p><span className="font-semibold">Website/business name:</span> {request.businessName}</p>
            <p><span className="font-semibold">Domain option:</span> {domainOptionLabel(request.domainOption)}</p>
            {request.domainOption !== DomainOption.WE_REGISTER_DOMAIN ? (
              <p className="text-xs text-slate-600">{domainOptionDescription(request.domainOption)}</p>
            ) : null}
            <p><span className="font-semibold">{isPaidState ? "Paid today:" : "Payable today:"}</span> {formatGbp(request.setupTotalGbp)}</p>
            <p><span className="font-semibold">Monthly subscription:</span> {formatGbp(request.monthlyTotalGbp)}/month</p>
            <div className="pt-2">
              <SetupStatusBadge status={request.status} />
              <p className="mt-2 text-xs text-slate-600">{setupStatusDescription(request.status)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">What we do next</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            <li>1. We check your order and confirm your domain details.</li>
            <li>2. We prepare your clean website and admin area.</li>
            <li>3. We send your business admin access details.</li>
            <li>4. We help point your domain to the site and aim to go live within a day once the domain is ready.</li>
          </ol>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {showContinuePayment ? (
          <button
            type="button"
            className={primaryButtonClass}
            disabled={startingCheckout}
            onClick={async () => {
              setCheckoutMessage(null);
              setStartingCheckout(true);
              const result = await createSetupCheckoutSession(request.id, token ?? undefined);
              if (result.ok) {
                window.location.assign(result.checkoutUrl);
                return;
              }

              if (result.error === "STRIPE_NOT_CONFIGURED") {
                setCheckoutMessage(
                  "Online checkout is not available in this environment yet. We'll confirm payment setup during onboarding.",
                );
              } else {
                setCheckoutMessage("We could not start checkout right now. Please try again shortly.");
              }
              setStartingCheckout(false);
            }}
          >
            {startingCheckout ? "Starting payment..." : "Continue to payment"}
          </button>
        ) : null}
        <Link href={`/setup/${request.templateSlug}`} className={primaryButtonClass}>Update order details</Link>
        <Link href={`/demo/${request.templateSlug}`} className={outlineButtonClass}>Back to demo site</Link>
        <Link href="/contact" className={outlineButtonClass}>Contact us</Link>
        <Link href="/#industries" className={outlineButtonClass}>Choose another business type</Link>
      </div>
      {checkoutMessage ? <p className="mt-3 text-sm text-slate-700">{checkoutMessage}</p> : null}
    </main>
  );
}
