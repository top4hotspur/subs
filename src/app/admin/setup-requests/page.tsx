"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BackendSetupRequestRecord,
  getBackendSetupRequest,
  listBackendSetupRequests,
  updateBackendSetupRequestStatus,
} from "@/lib/setup/admin-setup-request-client";
import { setupStatusLabel } from "@/lib/setup/status";
import {
  DomainOption,
  CommunicationOption,
  SubscriptionSetupStatus,
} from "@/lib/sites/types";
import {
  communicationOptionLabel,
  domainOptionLabel,
  formatGbp,
  formatUkDateTime,
  formatOptional,
} from "@/lib/ui/display-labels";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";

const ADMIN_EMAIL_KEY = "subs-platform-admin-email";
const STATUS_OPTIONS: SubscriptionSetupStatus[] = [
  SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
  SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED,
  SubscriptionSetupStatus.PAYMENT_PENDING,
  SubscriptionSetupStatus.SITE_PROVISIONING,
  SubscriptionSetupStatus.SITE_LIVE,
  SubscriptionSetupStatus.CHANGE_REQUESTED,
  SubscriptionSetupStatus.CANCELLED,
];

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Check the admin email allowlist and header value.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while contacting backend API.";
  }
  return `Request failed: ${error}`;
}

function parseOptionValue(value: string): DomainOption {
  if (Object.values(DomainOption).includes(value as DomainOption)) {
    return value as DomainOption;
  }
  return DomainOption.EXISTING_DOMAIN;
}

function parseCommunicationValue(value: string): CommunicationOption {
  if (Object.values(CommunicationOption).includes(value as CommunicationOption)) {
    return value as CommunicationOption;
  }
  return CommunicationOption.EMAIL_ONLY;
}

export default function AdminSetupRequestsPage() {
  const [adminEmail, setAdminEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<BackendSetupRequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<BackendSetupRequestRecord | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(ADMIN_EMAIL_KEY) && adminEmail) {
      window.localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail);
    }
  }, [adminEmail]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? detail,
    [requests, selectedId, detail],
  );

  async function loadRequests(): Promise<void> {
    if (!adminEmail.trim()) {
      setMessage("Enter a platform admin email first.");
      return;
    }

    setLoading(true);
    setMessage(null);
    window.localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());

    const result = await listBackendSetupRequests(adminEmail.trim(), { take: 100 });
    if (!result.ok) {
      setRequests([]);
      setDetail(null);
      setMessage(toMessage(result.error, result.status));
      setLoading(false);
      return;
    }

    setRequests(result.setupRequests);
    if (result.setupRequests.length > 0) {
      const firstId = result.setupRequests[0].id;
      setSelectedId(firstId);
      setDetail(result.setupRequests[0]);
      setStatusDrafts((current) => {
        const next = { ...current };
        result.setupRequests.forEach((request) => {
          if (!next[request.id]) next[request.id] = request.status;
        });
        return next;
      });
    } else {
      setSelectedId("");
      setDetail(null);
    }
    setLoading(false);
  }

  async function loadRequestDetail(id: string): Promise<void> {
    setSelectedId(id);
    const result = await getBackendSetupRequest(id);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setDetail(result.setupRequest);
  }

  async function saveStatus(requestId: string): Promise<void> {
    const nextStatus = statusDrafts[requestId];
    if (!nextStatus) return;
    if (!adminEmail.trim()) {
      setMessage("Enter a platform admin email before updating status.");
      return;
    }

    const result = await updateBackendSetupRequestStatus(
      adminEmail.trim(),
      requestId,
      nextStatus,
    );
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(`Status updated to ${setupStatusLabel(result.setupRequest.status as SubscriptionSetupStatus)}.`);
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? result.setupRequest : request,
      ),
    );
    if (selectedId === requestId) {
      setDetail(result.setupRequest);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform setup requests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Uses backend when configured. Temporary admin header until Auth.js is added.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-800">
          Platform admin email
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="email"
            className="min-w-[260px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="admin@example.com"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
          />
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={loadRequests}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load setup requests"}
          </button>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-slate-700">{message}</p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Persisted queue</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No persisted setup requests loaded yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedId === request.id
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => loadRequestDetail(request.id)}
                >
                  <p className="font-semibold text-slate-900">{request.businessName}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {request.industrySlug} · {setupStatusLabel(request.status as SubscriptionSetupStatus)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Created: {formatUkDateTime(request.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Setup request detail</h2>
          {!selectedRequest ? (
            <p className="mt-3 text-sm text-slate-600">
              Select a request to view details.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Business:</span> {selectedRequest.businessName}</p>
                <p><span className="font-semibold">Industry:</span> {selectedRequest.industrySlug}</p>
                <p><span className="font-semibold">Domain option:</span> {domainOptionLabel(parseOptionValue(selectedRequest.domainOption))}</p>
                <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(parseCommunicationValue(selectedRequest.communicationOption))}</p>
                <p><span className="font-semibold">Setup total:</span> {formatGbp(selectedRequest.setupTotalGbp)}</p>
                <p><span className="font-semibold">Monthly total:</span> {formatGbp(selectedRequest.monthlyTotalGbp)}</p>
                <p><span className="font-semibold">Status:</span> {setupStatusLabel(selectedRequest.status as SubscriptionSetupStatus)}</p>
                <p><span className="font-semibold">Created:</span> {formatUkDateTime(selectedRequest.createdAt)}</p>
                <p><span className="font-semibold">Contact:</span> {formatOptional(selectedRequest.contactName)}</p>
                <p><span className="font-semibold">Contact email:</span> {formatOptional(selectedRequest.contactEmail)}</p>
                <p><span className="font-semibold">Contact phone:</span> {formatOptional(selectedRequest.contactPhone)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Domain value:</span> {formatOptional(selectedRequest.existingDomain || selectedRequest.desiredDomain)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {formatOptional(selectedRequest.notes)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-sm font-semibold text-slate-900">Update status</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    className="min-w-[220px] rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={statusDrafts[selectedRequest.id] ?? selectedRequest.status}
                    onChange={(event) =>
                      setStatusDrafts((current) => ({
                        ...current,
                        [selectedRequest.id]: event.target.value,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {setupStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`${primaryButtonClass} ${smallButtonClass}`}
                    onClick={() => saveStatus(selectedRequest.id)}
                  >
                    Save status
                  </button>
                  <button
                    type="button"
                    className={`${dangerButtonClass} ${smallButtonClass}`}
                    onClick={() =>
                      setStatusDrafts((current) => ({
                        ...current,
                        [selectedRequest.id]: SubscriptionSetupStatus.CANCELLED,
                      }))
                    }
                  >
                    Mark cancelled
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
