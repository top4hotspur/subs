"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  applyAdminSiteLifecycleAction,
  AdminTenantSiteSummary,
  type AdminSiteLifecycleAction,
  createAdminTenantSiteFromSetupRequest,
  getAdminTenantSiteDetail,
  listAdminTenantSites,
  updateAdminSiteTaskStatus,
} from "@/lib/sites/admin-sites-client";
import {
  outlineButtonClass,
  primaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { formatGbp, formatOptional, formatUkDateTime } from "@/lib/ui/display-labels";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { lifecycleStatusLabel } from "@/lib/sites/site-lifecycle";

const TASK_STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "SKIPPED"];

type TaskGroupKey =
  | "setupReview"
  | "businessDetails"
  | "paymentSubscription"
  | "domainDns"
  | "siteConfiguration"
  | "goLive";

type SiteTask = {
  id: string;
  taskType: string;
  status: string;
  title: string;
  notes?: string | null;
};

const TASK_GROUP_LABELS: Record<TaskGroupKey, string> = {
  setupReview: "Setup review",
  businessDetails: "Business details",
  paymentSubscription: "Payment/subscription",
  domainDns: "Domain/DNS",
  siteConfiguration: "Site configuration",
  goLive: "Go-live",
};

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Check the allowlist and admin header email.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while contacting backend API.";
  }
  return `Request failed: ${error}`;
}

function groupTask(taskType: string): TaskGroupKey {
  if (taskType === "REVIEW_SETUP") return "setupReview";
  if (taskType === "CONFIRM_BUSINESS") return "businessDetails";
  if (taskType === "CONFIRM_SUBSCRIPTION") return "paymentSubscription";
  if (taskType === "CONFIRM_DOMAIN_OPTION" || taskType === "PREPARE_DNS") return "domainDns";
  if (taskType === "PREPARE_SITE_SETTINGS") return "siteConfiguration";
  return "goLive";
}

function getDomainOptionSummary(value?: string | null): string {
  if (!value) return "Not set";
  if (value === "EXISTING_DOMAIN") return "Existing domain";
  if (value === "CUSTOMER_BUYS_DOMAIN") return "Customer buys domain";
  if (value === "WE_REGISTER_DOMAIN") return "We register/manage domain";
  return value;
}

function lifecycleActionLabel(action: AdminSiteLifecycleAction): string {
  if (action === "MARK_DNS_INSTRUCTIONS_SENT") return "Mark DNS instructions sent";
  if (action === "MARK_DOMAIN_READY") return "Mark domain configured/ready";
  if (action === "MARK_SITE_LIVE") return "Mark site live";
  return "Suspend site";
}

export default function AdminSitesPage() {
  const [siteIdFromQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("siteId")?.trim() ?? "";
  });

  const [setupRequestId, setSetupRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sites, setSites] = useState<AdminTenantSiteSummary[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [detail, setDetail] = useState<{
    site: AdminTenantSiteSummary;
    domains: Array<{
      id: string;
      domain: string;
      domainType: string;
      status: string;
      registrarNotes?: string | null;
      createdAt: string;
    }>;
    tasks: SiteTask[];
    statusEvents: Array<{
      id: string;
      eventType: string;
      message?: string | null;
      createdAt: string;
    }>;
    subscription: {
      id: string;
      status: string;
      setupFeeGbp: number;
      monthlyFeeGbp: number;
      domainFeeGbp: number;
      whatsappAddonEnabled: boolean;
    } | null;
  } | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [domainTestHost, setDomainTestHost] = useState("");
  const [domainTestResult, setDomainTestResult] = useState<string | null>(null);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? detail?.site ?? null,
    [sites, selectedSiteId, detail],
  );

  const taskGroups = useMemo(() => {
    if (!detail) return [] as Array<{ key: TaskGroupKey; label: string; tasks: SiteTask[] }>;
    const grouped: Record<TaskGroupKey, typeof detail.tasks> = {
      setupReview: [],
      businessDetails: [],
      paymentSubscription: [],
      domainDns: [],
      siteConfiguration: [],
      goLive: [],
    };
    detail.tasks.forEach((task) => {
      grouped[groupTask(task.taskType)].push(task);
    });
    return (Object.keys(grouped) as TaskGroupKey[]).map((key) => ({
      key,
      label: TASK_GROUP_LABELS[key],
      tasks: grouped[key],
    }));
  }, [detail]);

  async function loadSites(): Promise<void> {
    setLoading(true);
    setMessage(null);

    const result = await listAdminTenantSites();
    if (!result.ok) {
      setSites([]);
      setDetail(null);
      setMessage(toMessage(result.error, result.status));
      setLoading(false);
      return;
    }

    setSites(result.sites);

    const queryMatch = siteIdFromQuery ? result.sites.find((site) => site.id === siteIdFromQuery) : null;
    const targetSite = queryMatch ?? result.sites[0] ?? null;

    if (targetSite) {
      setSelectedSiteId(targetSite.id);
      await loadSiteDetail(targetSite.id);
    } else {
      setSelectedSiteId("");
      setDetail(null);
    }

    setLoading(false);
  }

  async function loadSiteDetail(siteId: string): Promise<void> {
    const result = await getAdminTenantSiteDetail(siteId);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setSelectedSiteId(siteId);
    setDetail(result);
    setTaskDrafts((current) => {
      const next = { ...current };
      result.tasks.forEach((task) => {
        if (!next[task.id]) next[task.id] = task.status;
      });
      return next;
    });
  }

  async function startSiteSetup(): Promise<void> {
    if (!setupRequestId.trim()) {
      setMessage("Enter a setup request id.");
      return;
    }

    const result = await createAdminTenantSiteFromSetupRequest(setupRequestId.trim());
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(
      result.created
        ? `Site created and linked: ${result.tenantSite.displayName}.`
        : `Site already exists: ${result.tenantSite.displayName}.`,
    );

    await loadSites();
    await loadSiteDetail(result.tenantSite.id);
  }

  async function saveTaskStatus(taskId: string): Promise<void> {
    if (!selectedSiteId) return;
    const status = taskDrafts[taskId];
    if (!status) return;

    const result = await updateAdminSiteTaskStatus(selectedSiteId, taskId, status);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(`Task updated: ${result.task.title} -> ${result.task.status}.`);
    await loadSiteDetail(selectedSiteId);
  }

  async function runLifecycleAction(action: AdminSiteLifecycleAction): Promise<void> {
    if (!selectedSiteId) return;
    const confirmation =
      action === "SUSPEND_SITE"
        ? "Suspend this subscriber site? This does not cancel Stripe automatically and should only be used when platform access should be paused."
        : `${lifecycleActionLabel(action)}? DNS/domain changes are still manual; this only updates platform tracking.`;
    if (!window.confirm(confirmation)) return;

    const result = await applyAdminSiteLifecycleAction(selectedSiteId, action);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(`${lifecycleActionLabel(action)} completed.`);
    await loadSites();
    await loadSiteDetail(selectedSiteId);
  }

  async function runDomainResolutionTest(): Promise<void> {
    const candidate = domainTestHost.trim();
    if (!candidate) {
      setDomainTestResult("Enter a domain/host to test.");
      return;
    }

    try {
      const response = await fetch("/api/site-resolve-debug", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-test-site-host": candidate,
        },
      });
      const body = (await response.json()) as
        | {
            ok?: boolean;
            error?: string;
            matched?: boolean;
            tenantSiteId?: string | null;
            tenantSlug?: string | null;
            domainStatus?: string | null;
            matchedDomain?: string | null;
          }
        | null;

      if (!response.ok || !body?.ok) {
        setDomainTestResult(`Domain resolution test failed: ${body?.error ?? "UNKNOWN_ERROR"}`);
        return;
      }

      if (!body.matched) {
        setDomainTestResult(`No tenant match for "${candidate}".`);
        return;
      }

      setDomainTestResult(
        `Matched tenant ${body.tenantSlug ?? "(unknown)"} (${body.tenantSiteId ?? "n/a"}) via ${body.matchedDomain ?? candidate} [${body.domainStatus ?? "status unknown"}].`,
      );
    } catch {
      setDomainTestResult("Network error while testing domain resolution.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriber sites</h1>
          <p className="mt-2 text-sm text-slate-600">
            Persisted provisioning model. Platform-admin session required.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
        <AdminLogoutButton />
      </div>
      <AdminPillNav />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Authenticated platform-admin session required.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={loadSites}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load subscriber sites"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Create blank subscriber site from setup request</p>
          <p className="mt-1 text-xs text-slate-600">
            This creates live subscriber-site records with clean defaults. Demo data is not copied automatically.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={setupRequestId}
              onChange={(event) => setSetupRequestId(event.target.value)}
              placeholder="setup request id (cuid)"
              className="min-w-[280px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              className={`${primaryButtonClass} ${smallButtonClass}`}
              onClick={startSiteSetup}
            >
              Create blank subscriber site
            </button>
          </div>
        </div>

        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Subscriber sites</h2>
          {sites.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No persisted sites loaded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => loadSiteDetail(site.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedSiteId === site.id
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{site.displayName}</p>
                  <div className="mt-1 grid gap-1 text-xs text-slate-600">
                    <p>Industry: {formatOptional(site.industrySlug)}</p>
                    <p>Lifecycle: {lifecycleStatusLabel(site.status)}</p>
                    <p>Provisioning: {lifecycleStatusLabel(site.provisioningStatus)}</p>
                    <p>Domain: {lifecycleStatusLabel(site.domainStatus)}</p>
                    <p>Subscription: {lifecycleStatusLabel(site.subscriptionStatus)}</p>
                    <p>Primary domain: {formatOptional(site.domainPrimary)}</p>
                    <p>WhatsApp add-on: {site.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                    <p>Created: {formatUkDateTime(site.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Selected site details</h2>
          {!selectedSite || !detail ? (
            <p className="mt-3 text-sm text-slate-600">Select a site to inspect provisioning details.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Business:</span> {selectedSite.displayName}</p>
                <p><span className="font-semibold">Industry:</span> {formatOptional(selectedSite.industrySlug)}</p>
                <p><span className="font-semibold">Lifecycle status:</span> {lifecycleStatusLabel(selectedSite.status)}</p>
                <p><span className="font-semibold">Provisioning status:</span> {lifecycleStatusLabel(selectedSite.provisioningStatus)}</p>
                <p><span className="font-semibold">Domain status:</span> {lifecycleStatusLabel(selectedSite.domainStatus)}</p>
                <p><span className="font-semibold">Subscription status:</span> {lifecycleStatusLabel(selectedSite.subscriptionStatus)}</p>
                <p><span className="font-semibold">Primary domain:</span> {formatOptional(selectedSite.domainPrimary)}</p>
                <p><span className="font-semibold">WhatsApp add-on:</span> {selectedSite.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                <p><span className="font-semibold">Created:</span> {formatUkDateTime(selectedSite.createdAt)}</p>
                <p>
                  <span className="font-semibold">Public URL:</span>{" "}
                  <Link
                    href={`/sites/${encodeURIComponent(selectedSite.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline underline-offset-2"
                  >
                    /sites/{selectedSite.slug}
                  </Link>
                </p>
                <p>
                  <span className="font-semibold">Subscriber admin:</span>{" "}
                  <Link
                    href={`/site-admin/${encodeURIComponent(selectedSite.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline underline-offset-2"
                  >
                    /site-admin/{selectedSite.slug}
                  </Link>
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="text-sm font-semibold text-sky-950">Domain and go-live actions</p>
                <p className="mt-1 text-xs text-sky-900">
                  These actions update platform tracking only. Domain purchase, DNS records, certificate checks and final host routing are still manual/future work.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    "MARK_DNS_INSTRUCTIONS_SENT",
                    "MARK_DOMAIN_READY",
                    "MARK_SITE_LIVE",
                    "SUSPEND_SITE",
                  ] as AdminSiteLifecycleAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={`${action === "SUSPEND_SITE" ? "rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" : `${outlineButtonClass} ${smallButtonClass}`}`}
                      onClick={() => {
                        void runLifecycleAction(action);
                      }}
                    >
                      {lifecycleActionLabel(action)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Link
                  href={`/admin/sites/${encodeURIComponent(selectedSite.id)}/settings`}
                  className={`${primaryButtonClass} ${smallButtonClass}`}
                >
                  Persisted site settings
                </Link>
                <Link
                  href={`/admin/sites/${encodeURIComponent(selectedSite.id)}/preview`}
                  className={`ml-2 ${outlineButtonClass} ${smallButtonClass}`}
                >
                  Open persisted site preview
                </Link>
                <p className="mt-2 text-xs text-slate-600">
                  Support/provisioning settings editor until subscriber admin auth is added.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Domain panel</p>
                <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                  <p><span className="font-semibold">Domain option:</span> {getDomainOptionSummary(detail.site.setupRequest?.domainOption)}</p>
                  <p><span className="font-semibold">Domain status:</span> {lifecycleStatusLabel(selectedSite.domainStatus)}</p>
                  <p><span className="font-semibold">Existing domain:</span> {formatOptional(detail.site.setupRequest?.existingDomain)}</p>
                  <p><span className="font-semibold">Desired domain:</span> {formatOptional(detail.site.setupRequest?.desiredDomain)}</p>
                </div>
                {detail.domains.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No SiteDomain records yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.domains.map((domain) => (
                      <p key={domain.id}>
                        {domain.domain} ({domain.domainType}) - {lifecycleStatusLabel(domain.status)}
                        {domain.registrarNotes ? ` | ${domain.registrarNotes}` : ""}
                      </p>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-600">
                  DNS/domain automation is not live yet. Custom-domain runtime will resolve SiteDomain to TenantSite in a later pass.
                </p>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                  <p className="text-xs font-semibold text-slate-900">Test domain resolution</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={domainTestHost}
                      onChange={(event) => setDomainTestHost(event.target.value)}
                      placeholder="example.com"
                      className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => {
                        void runDomainResolutionTest();
                      }}
                    >
                      Test
                    </button>
                  </div>
                  {domainTestResult ? (
                    <p className="mt-2 text-xs text-slate-700">{domainTestResult}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Provisioning checklist</p>
                {taskGroups.every((group) => group.tasks.length === 0) ? (
                  <p className="mt-2 text-xs text-slate-600">No tasks available.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {taskGroups.map((group) => (
                      <div key={group.key} className="rounded-lg border border-slate-200 bg-white p-2">
                        <p className="text-xs font-semibold text-slate-900">{group.label}</p>
                        {group.tasks.length === 0 ? (
                          <p className="mt-1 text-xs text-slate-500">No tasks in this group.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {group.tasks.map((task) => (
                              <div key={task.id} className="rounded-md border border-slate-200 p-2">
                                <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                                <p className="text-xs text-slate-600">Status: {task.status}</p>
                                <p className="text-xs text-slate-600">Notes: {formatOptional(task.notes)}</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <select
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                    value={taskDrafts[task.id] ?? task.status}
                                    onChange={(event) =>
                                      setTaskDrafts((current) => ({ ...current, [task.id]: event.target.value }))
                                    }
                                  >
                                    {TASK_STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className={`${outlineButtonClass} ${smallButtonClass}`}
                                    onClick={() => saveTaskStatus(task.id)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Subscription placeholder</p>
                {!detail.subscription ? (
                  <p className="mt-2 text-xs text-slate-600">No subscription placeholder found.</p>
                ) : (
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <p><span className="font-semibold">Status:</span> {detail.subscription.status}</p>
                    <p><span className="font-semibold">Setup fee:</span> {formatGbp(detail.subscription.setupFeeGbp)}</p>
                    <p><span className="font-semibold">Monthly fee:</span> {formatGbp(detail.subscription.monthlyFeeGbp)}</p>
                    <p><span className="font-semibold">Domain fee:</span> {formatGbp(detail.subscription.domainFeeGbp)}</p>
                    <p><span className="font-semibold">WhatsApp add-on:</span> {detail.subscription.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                    <p><span className="font-semibold">Payment status:</span> Placeholder (no live payments yet)</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Status event timeline</p>
                {detail.statusEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No events yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.statusEvents.map((event) => (
                      <p key={event.id}>
                        {formatUkDateTime(event.createdAt)} - {event.eventType}
                        {event.message ? `: ${event.message}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

