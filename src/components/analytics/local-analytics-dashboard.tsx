"use client";

import { useMemo } from "react";
import { buildLocalAnalyticsSummary } from "@/lib/analytics/local-analytics";
import { CustomerRequest } from "@/lib/requests/request-types";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import { formatGbp, formatIsoDateTime } from "@/lib/ui/display-labels";

type LocalAnalyticsDashboardProps = {
  industrySlug?: WebsiteTemplateSlug;
  requests: CustomerRequest[];
  services?: SiteServiceItem[];
  staffMembers?: StaffMember[];
};

export function LocalAnalyticsDashboard({
  industrySlug,
  requests,
  services = [],
  staffMembers = [],
}: LocalAnalyticsDashboardProps) {
  const summary = useMemo(
    () =>
      buildLocalAnalyticsSummary({
        industrySlug,
        requests,
        services,
        staffMembers,
      }),
    [industrySlug, requests, services, staffMembers],
  );

  const completedOrConfirmed = summary.completedRequests + summary.confirmedRequests;

  if (summary.totalRequests === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Local analytics & income preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          No request data available yet for this view. Submit or seed mock customer requests to see analytics.
        </p>
        <p className="mt-3 text-xs text-slate-500">Local/browser-only preview. This is not production analytics or accounting.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Local analytics & income preview</h2>
      <p className="mt-2 text-sm text-slate-600">
        Demo summary derived from local mock requests, services, and staff.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-600">Total requests</p>
          <p className="text-xl font-semibold text-slate-900">{summary.totalRequests}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Confirmed + completed</p>
          <p className="text-xl font-semibold text-emerald-900">{completedOrConfirmed}</p>
        </article>
        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs text-rose-700">Cancelled + no-show</p>
          <p className="text-xl font-semibold text-rose-900">{summary.cancelledRequests + summary.noShowRequests}</p>
        </article>
        <article className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs text-sky-700">Estimated gross income</p>
          <p className="text-xl font-semibold text-sky-900">{formatGbp(summary.financialSummary.estimatedGrossIncomeGbp)}</p>
        </article>
      </div>

      <article className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Financial summary</h3>
        <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="font-semibold">Estimated gross:</span> {formatGbp(summary.financialSummary.estimatedGrossIncomeGbp)}</p>
          <p><span className="font-semibold">Confirmed:</span> {formatGbp(summary.financialSummary.confirmedIncomeGbp)}</p>
          <p><span className="font-semibold">Completed:</span> {formatGbp(summary.financialSummary.completedIncomeGbp)}</p>
          <p><span className="font-semibold">Pending/unpaid:</span> {formatGbp(summary.financialSummary.unpaidOrPendingGbp)}</p>
        </div>
      </article>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Top services</h3>
          <div className="mt-2 space-y-2 text-sm">
            {summary.topServices.length === 0 ? (
              <p className="text-slate-600">No service performance data yet.</p>
            ) : (
              summary.topServices.slice(0, 6).map((service) => (
                <div key={service.serviceName} className="rounded-md border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-900">{service.serviceName}</p>
                  <p className="text-slate-600">
                    Requests: {service.requestCount} | Completed: {service.completedCount} | Est. income: {formatGbp(service.estimatedIncomeGbp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Staff workload</h3>
          <div className="mt-2 space-y-2 text-sm">
            {summary.staffWorkload.length === 0 ? (
              <p className="text-slate-600">No staff workload data yet.</p>
            ) : (
              summary.staffWorkload.slice(0, 6).map((staff) => (
                <div key={staff.staffName} className="rounded-md border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-900">{staff.staffName}</p>
                  <p className="text-slate-600">
                    Assigned: {staff.assignedCount} | Completed: {staff.completedCount} | Est. income: {formatGbp(staff.estimatedIncomeGbp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Generated: {formatIsoDateTime(summary.generatedAtIso)}. Local/browser-only preview with simple estimates.
      </p>
    </section>
  );
}
