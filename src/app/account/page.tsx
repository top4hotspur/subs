"use client";

import Link from "next/link";
import { useState } from "react";
import {
  clearLocalSetupRequests,
  listLocalSetupRequests,
} from "@/lib/setup/local-setup-requests";
import {
  clearLocalCustomerRequests,
  listLocalCustomerRequests,
} from "@/lib/requests/local-customer-requests";
import { CustomerRequest } from "@/lib/requests/request-types";
import { LocalSetupRequest, SubscriptionSetupStatus } from "@/lib/sites/types";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import {
  communicationOptionLabel,
  domainOptionLabel,
  formatGbp,
  formatIsoDateTime,
  formatUkDate,
} from "@/lib/ui/display-labels";

export default function AccountPage() {
  const [setupRequests, setSetupRequests] = useState<LocalSetupRequest[]>(() =>
    listLocalSetupRequests(),
  );
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>(() =>
    listLocalCustomerRequests(),
  );

  const liveCount = setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE).length;
  const pendingCount = setupRequests.filter(
    (r) => r.status !== SubscriptionSetupStatus.SITE_LIVE && r.status !== SubscriptionSetupStatus.CANCELLED,
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Mock Customer Portal</h1>
      <p className="mt-3 text-slate-600">
        Local-only preview. Auth is not implemented and requests are stored in this browser only.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Local setup requests</p>
          <p className="text-2xl font-semibold text-slate-900">{setupRequests.length}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Active/live requests</p>
          <p className="text-2xl font-semibold text-slate-900">{liveCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Pending setup requests</p>
          <p className="text-2xl font-semibold text-slate-900">{pendingCount}</p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          onClick={() => {
            clearLocalSetupRequests();
            setSetupRequests([]);
          }}
        >
          Clear local setup requests
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          onClick={() => {
            clearLocalCustomerRequests();
            setCustomerRequests([]);
          }}
        >
          Clear local customer requests
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {setupRequests.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">No local setup requests found yet.</p>
            <Link href="/#industries" className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
              Go to business catalogue
            </Link>
          </article>
        ) : (
          setupRequests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{request.businessName}</h2>
                <SetupStatusBadge status={request.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
                <p><span className="font-semibold">Setup total:</span> {formatGbp(request.setupTotalGbp)}</p>
                <p><span className="font-semibold">Monthly total:</span> {formatGbp(request.monthlyTotalGbp)}</p>
                <p><span className="font-semibold">Domain option:</span> {domainOptionLabel(request.domainOption)}</p>
                <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(request.communicationOption)}</p>
                <p><span className="font-semibold">Created:</span> {formatIsoDateTime(request.createdAtIso)}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">My local requests/bookings</h2>
        {customerRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No local customer requests yet. Submit one from a demo page.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {customerRequests.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{request.serviceName || request.kind}</p>
                  <RequestStatusBadge status={request.status} compact />
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.templateSlug} • {request.customerName}</p>
                <p className="text-sm text-slate-600">Preferred: {request.preferredDate ? formatUkDate(request.preferredDate) : "TBC"} {request.preferredTime || ""}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        In the live version this area will show invoices, payment status, support requests, site/domain status and subscription details.
      </div>
    </main>
  );
}

