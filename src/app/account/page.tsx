"use client";

import Link from "next/link";
import {
  clearLocalSetupRequests,
  listLocalSetupRequests,
} from "@/lib/setup/local-setup-requests";
import { CommunicationOption, DomainOption, LocalSetupRequest, SubscriptionSetupStatus } from "@/lib/sites/types";
import { useState } from "react";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";

function domainOptionLabel(option: DomainOption): string {
  switch (option) {
    case DomainOption.EXISTING_DOMAIN:
      return "Existing domain";
    case DomainOption.CUSTOMER_BUYS_DOMAIN:
      return "Customer buys domain";
    case DomainOption.WE_REGISTER_DOMAIN:
      return "We register/manage domain";
    default:
      return option;
  }
}

function communicationOptionLabel(option: CommunicationOption): string {
  return option === CommunicationOption.EMAIL_AND_WHATSAPP
    ? "Email + WhatsApp"
    : "Email only";
}

export default function AccountPage() {
  const [requests, setRequests] = useState<LocalSetupRequest[]>(() =>
    listLocalSetupRequests(),
  );

  const liveCount = requests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE).length;
  const pendingCount = requests.filter(
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
          <p className="text-2xl font-semibold text-slate-900">{requests.length}</p>
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

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          onClick={() => {
            clearLocalSetupRequests();
            setRequests([]);
          }}
        >
          Clear local demo requests
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {requests.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">No local setup requests found yet.</p>
            <Link href="/#industries" className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
              Go to business catalogue
            </Link>
          </article>
        ) : (
          requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{request.businessName}</h2>
                <SetupStatusBadge status={request.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
                <p><span className="font-semibold">Setup total:</span> £{request.setupTotalGbp}</p>
                <p><span className="font-semibold">Monthly total:</span> £{request.monthlyTotalGbp}</p>
                <p><span className="font-semibold">Domain option:</span> {domainOptionLabel(request.domainOption)}</p>
                <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(request.communicationOption)}</p>
                <p><span className="font-semibold">Created:</span> {new Date(request.createdAtIso).toLocaleString()}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        In the live version this area will show invoices, payment status, support requests, site/domain status and subscription details.
      </div>
    </main>
  );
}
