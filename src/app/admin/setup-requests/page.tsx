"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  archiveBackendCancelledSetupRequest,
  BackendSetupRequestRecord,
  createSubscriberSiteFromPaidSetupRequest,
  getSetupRequestSiteAdminAccess,
  getBackendSetupRequest,
  listBackendSetupRequests,
  resetSetupRequestSiteAdminAccessCode,
  SetupRequestSiteAdminAccessInfo,
  updateBackendSetupRequestStatus,
} from "@/lib/setup/admin-setup-request-client";
import { setupStatusLabel } from "@/lib/setup/status";
import {
  CommunicationOption,
  DomainOption,
  SubscriptionSetupStatus,
} from "@/lib/sites/types";
import {
  communicationOptionLabel,
  domainOptionLabel,
  formatGbp,
  formatOptional,
  formatUkDateTime,
} from "@/lib/ui/display-labels";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";

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
  if (error === "SETUP_REQUEST_NOT_PAID") {
    return "This setup request is not paid yet, so provisioning is blocked.";
  }
  if (error === "SETUP_REQUEST_CANCELLED") {
    return "Cancelled requests cannot be provisioned.";
  }
  if (error === "SETUP_REQUEST_ARCHIVED") {
    return "Archived requests cannot be provisioned.";
  }
  if (error === "SETUP_REQUEST_ARCHIVE_NOT_ALLOWED") {
    return "Only non-paid, non-provisioned requests can be hidden from the queue.";
  }
  if (error === "SUBSCRIBER_SITE_NOT_PROVISIONED") {
    return "Provision the subscriber site first, then generate business admin access.";
  }
  if (error === "SITE_ADMIN_EMAIL_REQUIRED") {
    return "No business admin email is available yet. Add a contact email before generating an access code.";
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
  const offer = getWebsiteSubscriptionOffer();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<BackendSetupRequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<BackendSetupRequestRecord | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [siteSetupResult, setSiteSetupResult] = useState<{
    tenantSiteId: string;
    siteSlug: string;
    publicSiteUrl: string;
    adminSiteUrl: string;
    created: boolean;
  } | null>(null);
  const [siteAdminAccess, setSiteAdminAccess] = useState<SetupRequestSiteAdminAccessInfo | null>(null);
  const [siteAdminAccessCode, setSiteAdminAccessCode] = useState<string | null>(null);
  const [siteAdminAccessEmailStatus, setSiteAdminAccessEmailStatus] = useState<string | null>(null);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? detail,
    [requests, selectedId, detail],
  );

  useEffect(() => {
    let cancelled = false;

    async function syncSiteAdminAccess() {
      if (!selectedRequest?.tenantSite?.id) {
        setSiteAdminAccess(null);
        setSiteAdminAccessCode(null);
        return;
      }
      const accessResult = await getSetupRequestSiteAdminAccess(selectedRequest.id);
      if (cancelled) return;
      if (accessResult.ok) {
        setSiteAdminAccess(accessResult.access);
      } else {
        setSiteAdminAccess(null);
      }
    }

    void syncSiteAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [selectedRequest?.id, selectedRequest?.tenantSite?.id]);

  async function loadRequests(preferredSelectedId?: string): Promise<void> {
    setLoading(true);
    setMessage(null);

    const result = await listBackendSetupRequests({ take: 100 });
    if (!result.ok) {
      setRequests([]);
      setDetail(null);
      setMessage(toMessage(result.error, result.status));
      setLoading(false);
      return;
    }

    const nextRequests = result.setupRequests;
    setRequests(nextRequests);
    if (nextRequests.length > 0) {
      const keepId =
        preferredSelectedId && nextRequests.some((request) => request.id === preferredSelectedId)
          ? preferredSelectedId
          : selectedId && nextRequests.some((request) => request.id === selectedId)
            ? selectedId
            : nextRequests[0].id;
      setSelectedId(keepId);
      setDetail(nextRequests.find((request) => request.id === keepId) ?? nextRequests[0]);
      setStatusDrafts((current) => {
        const next = { ...current };
        nextRequests.forEach((request) => {
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
    setSiteAdminAccessCode(null);
    setSiteAdminAccessEmailStatus(null);
    if (result.setupRequest.tenantSite?.id) {
      const accessResult = await getSetupRequestSiteAdminAccess(id);
      if (accessResult.ok) {
        setSiteAdminAccess(accessResult.access);
      } else {
        setSiteAdminAccess(null);
      }
    } else {
      setSiteAdminAccess(null);
    }
  }

  async function saveStatus(requestId: string): Promise<void> {
    const nextStatus = statusDrafts[requestId];
    if (!nextStatus) return;
    const result = await updateBackendSetupRequestStatus(requestId, nextStatus);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setSiteSetupResult(null);
    setMessage(`Status updated to ${setupStatusLabel(result.setupRequest.status as SubscriptionSetupStatus)}.`);
    setRequests((current) =>
      current.map((request) => (request.id === requestId ? result.setupRequest : request)),
    );
    if (selectedId === requestId) {
      setDetail(result.setupRequest);
    }
  }

  async function startSiteSetup(requestId: string): Promise<void> {
    const result = await createSubscriberSiteFromPaidSetupRequest(requestId);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      setSiteSetupResult(null);
      return;
    }

    setSiteSetupResult({
      tenantSiteId: result.tenantSiteId,
      siteSlug: result.siteSlug,
      publicSiteUrl: result.publicSiteUrl,
      adminSiteUrl: result.adminSiteUrl,
      created: result.created,
    });
    setMessage(result.created ? "Subscriber site created." : "Subscriber site already provisioned.");
    await loadRequestDetail(requestId);
    await loadRequests(requestId);
  }

  async function resetSiteAdminAccessCode(requestId: string): Promise<void> {
    const confirmed = window.confirm(
      "Generate or reset the business admin access code for this subscriber site? The new code should be shared securely.",
    );
    if (!confirmed) return;

    const result = await resetSetupRequestSiteAdminAccessCode(requestId);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setSiteAdminAccess(result.access);
    setSiteAdminAccessCode(result.generatedAccessCode);
    setSiteAdminAccessEmailStatus(result.emailStatus);
    if (result.emailSent) {
      setMessage("Business admin access code generated and emailed.");
      return;
    }
    if (result.emailStatus === "EMAIL_NOT_CONFIGURED") {
      setMessage("Access code generated, but email is not configured. Share the one-time code manually for now.");
      return;
    }
    setMessage("Access code generated, but email delivery failed. Share the one-time code manually for now.");
  }

  async function hideFromQueue(requestId: string, cancelled: boolean): Promise<void> {
    const confirmed = window.confirm(
      cancelled
        ? "Remove this cancelled order from the queue? This cannot be undone."
        : "Hide this setup request from the active queue? This will not delete payment records and can be restored later in a future admin view.",
    );
    if (!confirmed) return;

    const result = await archiveBackendCancelledSetupRequest(requestId);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    const nextRequests = requests.filter((request) => request.id !== requestId);
    setRequests(nextRequests);
    if (selectedId === requestId) {
      const nextSelected = nextRequests[0] ?? null;
      setSelectedId(nextSelected?.id ?? "");
      setDetail(nextSelected);
    }
    setMessage(cancelled ? "Cancelled order removed from active queue." : "Setup request hidden from active queue.");
    setSiteSetupResult(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform setup requests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Uses persisted backend setup requests. Platform-admin login required.
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Starting setup creates a blank subscriber site structure; demo data is not copied automatically.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
        <AdminLogoutButton />
      </div>
      <AdminPillNav />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Authenticated platform-admin session required.
        </p>
        <div className="mt-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={() => {
              void loadRequests();
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load setup requests"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}

        {siteSetupResult ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm text-emerald-900">
              {siteSetupResult.created ? "Created site slug" : "Provisioned site slug"}:{" "}
              <span className="font-semibold">{siteSetupResult.siteSlug}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={siteSetupResult.publicSiteUrl}
                className={`${primaryButtonClass} ${smallButtonClass}`}
              >
                View subscriber site
              </Link>
              <Link
                href={siteSetupResult.adminSiteUrl}
                className={`${primaryButtonClass} ${smallButtonClass}`}
              >
                Open subscriber admin
              </Link>
              <Link href="/admin/sites" className={`${outlineButtonClass} ${smallButtonClass}`}>
                Open subscriber sites
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Persisted queue</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No persisted setup requests loaded yet.</p>
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
                  <p className="mt-1 text-xs text-slate-600">Created: {formatUkDateTime(request.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Setup request detail</h2>
          {!selectedRequest ? (
            <p className="mt-3 text-sm text-slate-600">Select a request to view details.</p>
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
                <p><span className="font-semibold">Payment status:</span> {formatOptional(selectedRequest.paymentStatus)}</p>
                <p><span className="font-semibold">Provisioned site slug:</span> {formatOptional(selectedRequest.tenantSite?.slug)}</p>
                <p>
                  <span className="font-semibold">Webhook confirmation:</span>{" "}
                  {selectedRequest.paymentStatus === "PAID" && selectedRequest.paymentCompletedAt
                    ? `received${selectedRequest.paymentCompletedAt ? ` (${formatUkDateTime(selectedRequest.paymentCompletedAt)})` : ""}`
                    : selectedRequest.paymentStatus === "CHECKOUT_STARTED"
                      ? "pending"
                      : "-"}
                </p>
                <p><span className="font-semibold">Created:</span> {formatUkDateTime(selectedRequest.createdAt)}</p>
                <p><span className="font-semibold">Contact:</span> {formatOptional(selectedRequest.contactName)}</p>
                <p><span className="font-semibold">Contact email:</span> {formatOptional(selectedRequest.contactEmail)}</p>
                <p><span className="font-semibold">Contact phone:</span> {formatOptional(selectedRequest.contactPhone)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Domain value:</span> {formatOptional(selectedRequest.existingDomain || selectedRequest.desiredDomain)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {formatOptional(selectedRequest.notes)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Stripe checkout session:</span> {formatOptional(selectedRequest.stripeCheckoutSessionId)}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Stripe subscription:</span> {formatOptional(selectedRequest.stripeSubscriptionId)}</p>
              </div>

              {selectedRequest.tenantSite?.slug ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-semibold">Subscriber site created</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/sites/${selectedRequest.tenantSite.slug}`}
                      className={`${primaryButtonClass} ${smallButtonClass}`}
                    >
                      View subscriber site
                    </Link>
                    <Link
                      href={`/site-admin/${selectedRequest.tenantSite.slug}`}
                      className={`${primaryButtonClass} ${smallButtonClass}`}
                    >
                      Open subscriber admin
                    </Link>
                  </div>
                </div>
              ) : null}

              {selectedRequest.tenantSite?.slug ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                  <p className="font-semibold">Business admin access handover</p>
                  <p className="mt-1">
                    <span className="font-semibold">Site slug:</span> {siteAdminAccess?.siteSlug ?? selectedRequest.tenantSite.slug}
                  </p>
                  <p>
                    <span className="font-semibold">Admin email:</span>{" "}
                    {formatOptional(siteAdminAccess?.adminEmail ?? selectedRequest.contactEmail)}
                  </p>
                  <p>
                    <span className="font-semibold">Access code exists:</span>{" "}
                    {siteAdminAccess?.accessCodeExists ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {formatOptional(siteAdminAccess?.invitationStatus)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => resetSiteAdminAccessCode(selectedRequest.id)}
                    >
                      {siteAdminAccess?.accessCodeExists
                        ? "Reset and email access code"
                        : "Generate and email access code"}
                    </button>
                    <Link
                      href={`/site-admin/${selectedRequest.tenantSite.slug}`}
                      className={`${primaryButtonClass} ${smallButtonClass}`}
                    >
                      Open subscriber admin
                    </Link>
                  </div>
                  {siteAdminAccessCode ? (
                    <div className="mt-3 rounded-md border border-sky-300 bg-white px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        One-time generated access code (dev handover)
                      </p>
                      <p className="mt-1 font-mono text-base text-sky-950">{siteAdminAccessCode}</p>
                      <p className="mt-1 text-xs text-sky-700">
                        Temporary dev/hosted handover. Use this if email delivery fails.
                      </p>
                    </div>
                  ) : null}
                  {siteAdminAccessEmailStatus ? (
                    <p className="mt-2 text-xs text-sky-800">
                      Email delivery status: <span className="font-semibold">{siteAdminAccessEmailStatus}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Commercial status</p>
                <p className="mt-1">Setup fee due: {formatGbp(offer.setupFeeGbp)}</p>
                <p>Monthly subscription due: {formatGbp(offer.monthlyFeeGbp)}/month</p>
                <p>
                  Domain fee applicable:{" "}
                  {parseOptionValue(selectedRequest.domainOption) === DomainOption.WE_REGISTER_DOMAIN
                    ? `${formatGbp(offer.domainRegistrationFeeGbp)} (new domain registration/management)`
                    : "No domain fee expected (customer-managed domain option)"}
                </p>
                <p>
                  Payment status:{" "}
                  {selectedRequest.paymentStatus
                    ? selectedRequest.paymentStatus
                    : "NOT_STARTED (checkout not started)"}
                </p>
                <p>
                  Webhook/payment confirmation:{" "}
                  {selectedRequest.paymentStatus === "PAID" && selectedRequest.paymentCompletedAt
                    ? "received"
                    : selectedRequest.paymentStatus === "CHECKOUT_STARTED"
                      ? "pending"
                      : "pending"}
                </p>
                <p className="mt-1">
                  Next action:{" "}
                  {selectedRequest.paymentStatus === "PAYMENT_FAILED"
                    ? "contact customer and retry checkout, then confirm subscription payment."
                    : selectedRequest.paymentStatus === "PAID"
                      ? "continue provisioning and move the subscriber site toward go-live."
                      : "contact customer, confirm domain path, then complete checkout/subscription onboarding."}
                </p>
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
                  {selectedRequest.paymentStatus === "PAID" &&
                  selectedRequest.status !== SubscriptionSetupStatus.CANCELLED &&
                  !selectedRequest.archivedAt &&
                  !selectedRequest.tenantSite?.id ? (
                    <button
                      type="button"
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => startSiteSetup(selectedRequest.id)}
                    >
                      Create blank subscriber site
                    </button>
                  ) : null}
                  {selectedRequest.status === SubscriptionSetupStatus.CANCELLED ? (
                    <button
                      type="button"
                      className={`${dangerButtonClass} ${smallButtonClass}`}
                      onClick={() => hideFromQueue(selectedRequest.id, true)}
                    >
                      Remove from queue
                    </button>
                  ) : null}
                  {selectedRequest.status !== SubscriptionSetupStatus.CANCELLED &&
                  selectedRequest.paymentStatus !== "PAID" &&
                  selectedRequest.paymentStatus !== "SUBSCRIPTION_ACTIVE" &&
                  !selectedRequest.tenantSite?.id &&
                  !selectedRequest.archivedAt ? (
                    <button
                      type="button"
                      className={`${dangerButtonClass} ${smallButtonClass}`}
                      onClick={() => hideFromQueue(selectedRequest.id, false)}
                    >
                      Hide from queue
                    </button>
                  ) : null}
                  <Link
                    href={`/admin/sites${siteSetupResult ? `?siteId=${encodeURIComponent(siteSetupResult.tenantSiteId)}` : ""}`}
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                  >
                    Open subscriber sites
                  </Link>
                </div>
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

