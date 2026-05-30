"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatGbp, formatUkDateTime } from "@/lib/ui/display-labels";

type ReportKey =
  | "orders"
  | "subscribers"
  | "payment-fails"
  | "sales"
  | "contact"
  | "revenue-by-industry";

type DashboardSummary = {
  orderQueueCount: number;
  liveSubscriberSiteCount: number;
  paymentFailCount: number;
  orderStatusCounts: Array<{ status: string; count: number }>;
  subscriberStatusCounts: Array<{ status: string; count: number }>;
  contactEnquiryCounts: Array<{ status: string; count: number }>;
  salesLeadStatusCounts: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    businessName: string;
    industrySlug: string;
    status: string;
    createdAt: string;
    setupTotalGbp: number;
    monthlyTotalGbp: number;
    paymentStatus: string | null;
  }>;
  recentSites: Array<{
    id: string;
    slug: string;
    displayName: string;
    industrySlug: string | null;
    status: string;
    provisioningStatus: string | null;
    subscriptionStatus: string | null;
    createdAt: string;
  }>;
  recentContactEnquiries: Array<{
    id: string;
    name: string;
    businessName: string | null;
    email: string;
    status: string;
    createdAt: string;
  }>;
  recentSalesLeads: Array<{
    id: string;
    businessName: string;
    industrySlug: string | null;
    status: string;
    createdAt: string;
  }>;
  paymentFailureRows: Array<{
    siteId: string;
    siteName: string;
    industrySlug: string | null;
    subscriptionStatus: string;
    monthlyFeeGbp: number;
  }>;
  revenueByIndustry: Array<{
    industry: string;
    activeSubscriberSites: number;
    monthlyRevenueEstimateGbp: number;
    setupFeesKnownGbp: number;
    domainFeesKnownGbp: number;
    paymentFailuresKnown: number;
  }>;
};

async function getSummary(): Promise<
  | { ok: true; summary: DashboardSummary }
  | { ok: false; error: string; status: number }
> {
  try {
    const response = await fetch("/api/admin/dashboard-summary", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await response.json()) as
      | { ok?: boolean; summary?: DashboardSummary; error?: string }
      | null;
    if (!response.ok || !body?.ok || !body.summary) {
      return {
        ok: false,
        error: body?.error ?? "DASHBOARD_SUMMARY_FAILED",
        status: response.status,
      };
    }
    return { ok: true, summary: body.summary };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminPage() {
  const [selectedReport, setSelectedReport] = useState<ReportKey>("orders");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await getSummary();
      if (cancelled) return;
      if (!result.ok) {
        setSummary(null);
        setError(
          result.error === "BACKEND_PERSISTENCE_NOT_CONFIGURED"
            ? "Backend persistence is not configured in this environment."
            : "Could not load dashboard metrics right now.",
        );
      } else {
        setSummary(result.summary);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = useMemo(
    () => [
      {
        key: "orders" as const,
        label: "Order Requests",
        metric: summary ? String(summary.orderQueueCount) : "—",
        hint: "Order/setup requests currently in queue",
      },
      {
        key: "subscribers" as const,
        label: "Subscriber Sites",
        metric: summary ? String(summary.liveSubscriberSiteCount) : "—",
        hint: "Live subscriber sites",
      },
      {
        key: "payment-fails" as const,
        label: "Payment Fails",
        metric: summary ? String(summary.paymentFailCount) : "—",
        hint: "Latest known payment failures",
      },
      {
        key: "sales" as const,
        label: "Sales Pipeline",
        metric: summary ? String(summary.salesLeadStatusCounts.reduce((sum, row) => sum + row.count, 0)) : "—",
        hint: "Current sales lead records",
      },
      {
        key: "contact" as const,
        label: "Contact Enquiries",
        metric: summary ? String(summary.contactEnquiryCounts.reduce((sum, row) => sum + row.count, 0)) : "—",
        hint: "Support and pre-order enquiries",
      },
      {
        key: "revenue-by-industry" as const,
        label: "Revenue by Industry",
        metric: summary ? String(summary.revenueByIndustry.length) : "—",
        hint: "Industries with revenue rows",
      },
    ],
    [summary],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage MyExperiment.club orders, subscriber sites, payments, enquiries and sales pipeline.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminPillNav />

      {error ? (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Platform Operations</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              className={`rounded-xl border p-4 text-left ${
                selectedReport === tile.key
                  ? "border-sky-300 bg-sky-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              onClick={() => setSelectedReport(tile.key)}
            >
              <p className="text-sm font-semibold text-slate-900">{tile.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{loading ? "…" : tile.metric}</p>
              <p className="mt-1 text-xs text-slate-600">{tile.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {selectedReport === "orders" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Order Requests</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {summary?.orderStatusCounts.map((row) => (
                <div key={row.status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold">{statusLabel(row.status)}:</span> {row.count}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {summary?.recentOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{order.businessName}</p>
                  <p className="text-slate-700">
                    {order.industrySlug} · {statusLabel(order.status)} · {formatUkDateTime(order.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/setup-requests" className={`${primaryButtonClass} ${smallButtonClass}`}>
                Open full order requests
              </Link>
            </div>
          </>
        ) : null}

        {selectedReport === "subscribers" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Subscriber Sites</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {summary?.subscriberStatusCounts.map((row) => (
                <div key={row.status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold">{statusLabel(row.status)}:</span> {row.count}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {summary?.recentSites.map((site) => (
                <div key={site.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{site.displayName}</p>
                  <p className="text-slate-700">
                    /sites/{site.slug} · {statusLabel(site.status)} · {formatUkDateTime(site.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/sites" className={`${primaryButtonClass} ${smallButtonClass}`}>
                Open subscriber sites
              </Link>
            </div>
          </>
        ) : null}

        {selectedReport === "payment-fails" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Payment Fails</h2>
            {summary?.paymentFailureRows.length ? (
              <div className="mt-3 space-y-2">
                {summary.paymentFailureRows.map((row) => (
                  <div key={row.siteId} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                    <p className="font-semibold text-rose-900">{row.siteName}</p>
                    <p className="text-rose-800">
                      {row.industrySlug ?? "unassigned"} · {statusLabel(row.subscriptionStatus)} · {formatGbp(row.monthlyFeeGbp)}/month
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-700">
                No failed payments are currently available. Stripe/webhook payment failure reporting will populate this once checkout is live.
              </p>
            )}
          </>
        ) : null}

        {selectedReport === "sales" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Sales Pipeline</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {summary?.salesLeadStatusCounts.map((row) => (
                <div key={row.status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold">{statusLabel(row.status)}:</span> {row.count}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {summary?.recentSalesLeads.map((lead) => (
                <div key={lead.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{lead.businessName}</p>
                  <p className="text-slate-700">
                    {lead.industrySlug ?? "unassigned"} · {statusLabel(lead.status)} · {formatUkDateTime(lead.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/sales" className={`${primaryButtonClass} ${smallButtonClass}`}>
                Open full sales pipeline
              </Link>
            </div>
          </>
        ) : null}

        {selectedReport === "contact" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Contact Enquiries</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {summary?.contactEnquiryCounts.map((row) => (
                <div key={row.status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold">{statusLabel(row.status)}:</span> {row.count}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {summary?.recentContactEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{enquiry.businessName ?? enquiry.name}</p>
                  <p className="text-slate-700">
                    {enquiry.email} · {statusLabel(enquiry.status)} · {formatUkDateTime(enquiry.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/contact-enquiries" className={`${primaryButtonClass} ${smallButtonClass}`}>
                Open full contact enquiries
              </Link>
            </div>
          </>
        ) : null}

        {selectedReport === "revenue-by-industry" ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Revenue by Industry</h2>
            <p className="mt-2 text-sm text-slate-600">
              Month-on-month revenue will become available once subscription payment records/webhooks are connected.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-2 py-2">Industry</th>
                    <th className="px-2 py-2">Active subscriber sites</th>
                    <th className="px-2 py-2">Monthly revenue estimate</th>
                    <th className="px-2 py-2">Setup fees known</th>
                    <th className="px-2 py-2">Domain fees known</th>
                    <th className="px-2 py-2">Payment failures</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.revenueByIndustry ?? []).map((row) => (
                    <tr key={row.industry} className="border-b border-slate-100">
                      <td className="px-2 py-2">{row.industry}</td>
                      <td className="px-2 py-2">{row.activeSubscriberSites}</td>
                      <td className="px-2 py-2">{formatGbp(row.monthlyRevenueEstimateGbp)}</td>
                      <td className="px-2 py-2">{formatGbp(row.setupFeesKnownGbp)}</td>
                      <td className="px-2 py-2">{formatGbp(row.domainFeesKnownGbp)}</td>
                      <td className="px-2 py-2">{row.paymentFailuresKnown}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!summary?.revenueByIndustry.length ? (
              <p className="mt-3 text-sm text-slate-700">No revenue rows are currently available.</p>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/setup-requests" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Order Requests
        </Link>
        <Link href="/admin/sites" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Subscriber Sites
        </Link>
        <Link href="/admin/sales" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Sales Pipeline
        </Link>
        <Link href="/admin/contact-enquiries" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Contact Enquiries
        </Link>
      </section>
    </main>
  );
}
