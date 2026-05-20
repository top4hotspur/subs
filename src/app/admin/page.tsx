"use client";

import {
  listLocalSetupRequests,
  seedLocalSetupRequests,
  updateLocalSetupRequestStatus,
} from "@/lib/setup/local-setup-requests";
import {
  CommunicationOption,
  DomainOption,
  LocalSetupRequest,
  SubscriptionSetupStatus,
} from "@/lib/sites/types";
import { useMemo, useState } from "react";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";

type AdminFilter = "ALL" | "REVIEW" | "DOMAIN" | "PAYMENT" | "PROVISIONING" | "LIVE";

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

export default function AdminPage() {
  const [requests, setRequests] = useState<LocalSetupRequest[]>(() => listLocalSetupRequests());
  const [filter, setFilter] = useState<AdminFilter>("ALL");

  function refresh(): void {
    setRequests(listLocalSetupRequests());
  }

  function setStatus(id: string, status: SubscriptionSetupStatus): void {
    updateLocalSetupRequestStatus(id, status);
    refresh();
  }

  const counts = {
    total: requests.length,
    review: requests.filter((r) => r.status === SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED).length,
    domain: requests.filter((r) => r.status === SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED).length,
    payment: requests.filter((r) => r.status === SubscriptionSetupStatus.PAYMENT_PENDING).length,
    provisioning: requests.filter((r) => r.status === SubscriptionSetupStatus.SITE_PROVISIONING).length,
    live: requests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE).length,
  };

  const filteredRequests = useMemo(() => {
    switch (filter) {
      case "REVIEW":
        return requests.filter((r) => r.status === SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED);
      case "DOMAIN":
        return requests.filter((r) => r.status === SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED);
      case "PAYMENT":
        return requests.filter((r) => r.status === SubscriptionSetupStatus.PAYMENT_PENDING);
      case "PROVISIONING":
        return requests.filter((r) => r.status === SubscriptionSetupStatus.SITE_PROVISIONING);
      case "LIVE":
        return requests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE);
      case "ALL":
      default:
        return requests;
    }
  }, [requests, filter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Mock Admin Portal</h1>
      <p className="mt-3 text-slate-600">Local-only queue preview. Auth/backends are not implemented yet.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Total</p><p className="text-xl font-semibold">{counts.total}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Review requested</p><p className="text-xl font-semibold">{counts.review}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Domain required</p><p className="text-xl font-semibold">{counts.domain}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Payment pending</p><p className="text-xl font-semibold">{counts.payment}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Provisioning</p><p className="text-xl font-semibold">{counts.provisioning}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Live</p><p className="text-xl font-semibold">{counts.live}</p></article>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["ALL", "All"],
          ["REVIEW", "Review requested"],
          ["DOMAIN", "Domain details required"],
          ["PAYMENT", "Payment pending"],
          ["PROVISIONING", "Provisioning"],
          ["LIVE", "Live"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            onClick={() => setFilter(value as AdminFilter)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          onClick={() => {
            seedLocalSetupRequests();
            refresh();
          }}
        >
          Load sample requests
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {filteredRequests.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">No requests match this filter.</p>
            <button
              type="button"
              className="mt-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              onClick={() => {
                seedLocalSetupRequests();
                refresh();
              }}
            >
              Load sample requests
            </button>
          </article>
        ) : (
          filteredRequests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{request.businessName}</h2>
                <SetupStatusBadge status={request.status} />
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
                <p><span className="font-semibold">Contact:</span> {request.contactName || "-"}</p>
                <p><span className="font-semibold">Contact email:</span> {request.contactEmail || "-"}</p>
                <p><span className="font-semibold">Contact phone:</span> {request.contactPhone || "-"}</p>
                <p><span className="font-semibold">Domain choice:</span> {domainOptionLabel(request.domainOption)}</p>
                <p><span className="font-semibold">Domain value:</span> {request.existingDomain || request.desiredDomain || "-"}</p>
                <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(request.communicationOption)}</p>
                <p><span className="font-semibold">WhatsApp add-on:</span> {request.communicationOption === CommunicationOption.EMAIL_AND_WHATSAPP ? "Yes" : "No"}</p>
                <p><span className="font-semibold">Setup total:</span> £{request.setupTotalGbp}</p>
                <p><span className="font-semibold">Monthly total:</span> £{request.monthlyTotalGbp}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {request.notes || "-"}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setStatus(request.id, SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED)}>
                  Domain details required
                </button>
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setStatus(request.id, SubscriptionSetupStatus.PAYMENT_PENDING)}>
                  Payment pending
                </button>
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setStatus(request.id, SubscriptionSetupStatus.SITE_PROVISIONING)}>
                  Provisioning
                </button>
                <button type="button" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700" onClick={() => setStatus(request.id, SubscriptionSetupStatus.SITE_LIVE)}>
                  Live
                </button>
                <button type="button" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100" onClick={() => setStatus(request.id, SubscriptionSetupStatus.CANCELLED)}>
                  Cancelled
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
