"use client";

import Link from "next/link";
import { useState } from "react";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";
import { setupStatusDescription } from "@/lib/setup/status";
import { getLocalSetupRequest } from "@/lib/setup/local-setup-requests";
import { LocalSetupRequest } from "@/lib/sites/types";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui/button-styles";
import {
  communicationOptionDescription,
  communicationOptionLabel,
  domainOptionDescription,
  domainOptionLabel,
  formatGbp,
} from "@/lib/ui/display-labels";

function readRequestFromLocation(): LocalSetupRequest | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return null;
  return getLocalSetupRequest(requestId);
}

export default function SetupConfirmationPage() {
  const [request] = useState<LocalSetupRequest | null>(() => readRequestFromLocation());

  if (!request) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Setup request not found</h1>
          <p className="mt-3 text-slate-600">We could not find this local mock setup request in your browser.</p>
          <Link href="/" className="mt-5 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">Back to homepage</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-emerald-900">Setup request received</h1>
        <p className="mt-3 text-emerald-800">Your setup request is saved locally in this browser for demo purposes.</p>
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
            <li>1. We review your demo/customisation</li>
            <li>2. We confirm domain/payment details</li>
            <li>3. We provision your website</li>
            <li>4. We connect your domain</li>
            <li>5. Your site goes live</li>
          </ol>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/account" className={primaryButtonClass}>View customer portal</Link>
        <Link href={`/demo/${request.templateSlug}/customise`} className={outlineButtonClass}>Back to customise demo</Link>
        <Link href="/#industries" className={outlineButtonClass}>Choose another business type</Link>
      </div>
    </main>
  );
}

