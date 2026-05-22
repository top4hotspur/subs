"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminTenantSiteSummary,
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

const ADMIN_EMAIL_KEY = "subs-platform-admin-email";
const TASK_STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "SKIPPED"];

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

export default function AdminSitesPage() {
  const [adminEmail, setAdminEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
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
    tasks: Array<{
      id: string;
      taskType: string;
      status: string;
      title: string;
      notes?: string | null;
    }>;
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

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? detail?.site ?? null,
    [sites, selectedSiteId, detail],
  );

  async function loadSites(): Promise<void> {
    if (!adminEmail.trim()) {
      setMessage("Enter a platform admin email first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    window.localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
    const result = await listAdminTenantSites(adminEmail.trim());
    if (!result.ok) {
      setSites([]);
      setDetail(null);
      setMessage(toMessage(result.error, result.status));
      setLoading(false);
      return;
    }

    setSites(result.sites);
    if (result.sites.length > 0) {
      const first = result.sites[0];
      setSelectedSiteId(first.id);
      await loadSiteDetail(first.id, adminEmail.trim());
    } else {
      setSelectedSiteId("");
      setDetail(null);
    }
    setLoading(false);
  }

  async function loadSiteDetail(siteId: string, explicitEmail?: string): Promise<void> {
    const email = explicitEmail ?? adminEmail.trim();
    if (!email) return;
    const result = await getAdminTenantSiteDetail(email, siteId);
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
    if (!adminEmail.trim()) {
      setMessage("Enter a platform admin email first.");
      return;
    }
    if (!setupRequestId.trim()) {
      setMessage("Enter a setup request id.");
      return;
    }
    setMessage(null);
    const result = await createAdminTenantSiteFromSetupRequest(
      adminEmail.trim(),
      setupRequestId.trim(),
    );
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setMessage(
      result.created
        ? `Site created: ${result.tenantSite.displayName} (${result.tenantSite.id}).`
        : `Site already exists: ${result.tenantSite.displayName} (${result.tenantSite.id}).`,
    );
    await loadSites();
    setSelectedSiteId(result.tenantSite.id);
    await loadSiteDetail(result.tenantSite.id, adminEmail.trim());
  }

  async function saveTaskStatus(taskId: string): Promise<void> {
    if (!selectedSiteId) return;
    const status = taskDrafts[taskId];
    if (!status) return;
    const result = await updateAdminSiteTaskStatus(adminEmail.trim(), selectedSiteId, taskId, status);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setMessage(`Task updated: ${result.task.title} -> ${result.task.status}.`);
    await loadSiteDetail(selectedSiteId);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriber sites</h1>
          <p className="mt-2 text-sm text-slate-600">
            Persisted provisioning model only. No AWS/domain automation is triggered.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-800">Platform admin email</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="email"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            placeholder="admin@example.com"
            className="min-w-[260px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={loadSites} disabled={loading}>
            {loading ? "Loading..." : "Load sites"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Create site from setup request</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={setupRequestId}
              onChange={(event) => setSetupRequestId(event.target.value)}
              placeholder="setup request id (cuid)"
              className="min-w-[280px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={startSiteSetup}>
              Start site setup
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sites</h2>
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
                  <p className="mt-1 text-xs text-slate-600">
                    {formatOptional(site.industrySlug)} | {formatOptional(site.provisioningStatus)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Domain: {formatOptional(site.domainStatus)} | Subscription: {formatOptional(site.subscriptionStatus)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Primary domain: {formatOptional(site.domainPrimary)}</p>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Site detail</h2>
          {!selectedSite || !detail ? (
            <p className="mt-3 text-sm text-slate-600">Select a site to inspect provisioning details.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Business:</span> {selectedSite.displayName}</p>
                <p><span className="font-semibold">Industry:</span> {formatOptional(selectedSite.industrySlug)}</p>
                <p><span className="font-semibold">Provisioning:</span> {formatOptional(selectedSite.provisioningStatus)}</p>
                <p><span className="font-semibold">Domain status:</span> {formatOptional(selectedSite.domainStatus)}</p>
                <p><span className="font-semibold">Subscription status:</span> {formatOptional(selectedSite.subscriptionStatus)}</p>
                <p><span className="font-semibold">Primary domain:</span> {formatOptional(selectedSite.domainPrimary)}</p>
                <p><span className="font-semibold">Created:</span> {formatUkDateTime(selectedSite.createdAt)}</p>
                <p><span className="font-semibold">Site id:</span> {selectedSite.id}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Domain records</p>
                {detail.domains.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No domain records yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.domains.map((domain) => (
                      <p key={domain.id}>
                        {domain.domain} ({domain.domainType}) - {domain.status}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Provisioning checklist</p>
                {detail.tasks.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No tasks available.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {detail.tasks.map((task) => (
                      <div key={task.id} className="rounded-md border border-slate-200 bg-white p-2">
                        <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-600">Type: {task.taskType}</p>
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Status events</p>
                {detail.statusEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No events yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.statusEvents.slice(0, 8).map((event) => (
                      <p key={event.id}>
                        {formatUkDateTime(event.createdAt)} - {event.eventType}
                        {event.message ? `: ${event.message}` : ""}
                      </p>
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
                    <p>Status: {detail.subscription.status}</p>
                    <p>Setup fee: {formatGbp(detail.subscription.setupFeeGbp)}</p>
                    <p>Monthly fee: {formatGbp(detail.subscription.monthlyFeeGbp)}</p>
                    <p>Domain fee: {formatGbp(detail.subscription.domainFeeGbp)}</p>
                    <p>WhatsApp add-on: {detail.subscription.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
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
