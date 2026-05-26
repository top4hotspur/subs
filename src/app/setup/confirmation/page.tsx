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
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui/button-styles";
import {
  communicationOptionDescription,
  communicationOptionLabel,
  domainOptionDescription,
  domainOptionLabel,
  formatGbp,
} from "@/lib/ui/display-labels";
import { getSetupRequestFromBackend } from "@/lib/setup/setup-request-backend-client";
import {
  mapBackendSetupRequestToDisplay,
  mapLocalSetupRequestToDisplay,
  SetupRequestDisplay,
} from "@/lib/setup/setup-request-mappers";

type RequestSourceHint = "backend" | "local" | "unknown";

function readParamsFromLocation(): { requestId: string | null; source: RequestSourceHint; token: string | null } {
  if (typeof window === "undefined") {
    return { requestId: null, source: "unknown", token: null };
  }
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  const token = params.get("token");
  const sourceParam = params.get("source");
  if (sourceParam === "backend") {
    return { requestId, source: "backend", token };
  }
  if (sourceParam === "local") {
    return { requestId, source: "local", token };
  }
  return { requestId, source: "unknown", token };
}

export default function SetupConfirmationPage() {
  const [{ requestId, source, token }] = useState(() => readParamsFromLocation());
  const [request, setRequest] = useState<SetupRequestDisplay | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentRequests] = useState<LocalSetupRequest[]>(() =>
    typeof window === "undefined" ? [] : listLocalSetupRequests().slice(0, 5),
  );

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
          <h1 className="text-2xl font-bold text-slate-900">Loading setup request...</h1>
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
              "We could not load that setup request. If you opened an older link or the request has expired, please submit setup details again."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/setup/barbers" className={primaryButtonClass}>Submit setup request</Link>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-emerald-900">Setup request received</h1>
        <p className="mt-3 text-emerald-800">
          {request.source === "backend"
            ? "Saved successfully."
            : "Request reference created."}
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          No payment has been taken yet. We&apos;ll confirm domain details and payment setup with you during onboarding.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Request summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Business:</span> {request.businessName}</p>
            <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
            <p><span className="font-semibold">Domain option:</span> {domainOptionLabel(request.domainOption)}</p>
            <p className="text-xs text-slate-600">{domainOptionDescription(request.domainOption)}</p>
            <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(request.communicationOption)}</p>
            <p className="text-xs text-slate-600">{communicationOptionDescription(request.communicationOption)}</p>
            <p><span className="font-semibold">Setup total:</span> {formatGbp(request.setupTotalGbp)}</p>
            <p><span className="font-semibold">Monthly total:</span> {formatGbp(request.monthlyTotalGbp)}</p>
            <div className="pt-2">
              <SetupStatusBadge status={request.status} />
              <p className="mt-2 text-xs text-slate-600">{setupStatusDescription(request.status)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">What happens next</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            <li>1. We review your setup details</li>
            <li>2. We confirm your domain details and onboarding/payment steps</li>
            <li>3. We provision your clean subscriber site structure</li>
            <li>4. You add your real services, staff, prices and page content</li>
            <li>5. We connect your domain and take your site live</li>
          </ol>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/setup/${request.templateSlug}`} className={primaryButtonClass}>Update setup details</Link>
        <Link href={`/demo/${request.templateSlug}`} className={outlineButtonClass}>Back to demo site</Link>
        <Link href="/contact" className={outlineButtonClass}>Contact us</Link>
        <Link href="/#industries" className={outlineButtonClass}>Choose another business type</Link>
      </div>
    </main>
  );
}
