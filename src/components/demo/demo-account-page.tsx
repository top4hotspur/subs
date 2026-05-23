"use client";

import { useMemo, useState } from "react";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import {
  listLocalCustomerRequests,
  LOCAL_CUSTOMER_REQUESTS_KEY,
} from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import { formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";

type DemoAccountPageProps = {
  template: WebsiteTemplate;
};

export function DemoAccountPage({ template }: DemoAccountPageProps) {
  const settings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const [requests, setRequests] = useState(() =>
    listLocalCustomerRequests().filter(
      (request) => request.templateSlug === template.slug,
    ),
  );

  const upcoming = requests.filter(
    (request) =>
      request.status !== CustomerRequestStatus.CANCELLED &&
      request.status !== CustomerRequestStatus.COMPLETED,
  );
  const history = requests.filter(
    (request) =>
      request.status === CustomerRequestStatus.COMPLETED ||
      request.status === CustomerRequestStatus.CANCELLED,
  );

  function cancellationPolicyNote(): string {
    const policy = settings.policySettings;
    if (!policy?.cancellationEnabled) {
      return "Cancellation policy is currently managed directly by the business.";
    }
    return `Full refund when cancelled at least ${policy.fullRefundNoticeDays} day(s) before appointment. No refund for cancellations within ${policy.noRefundWithinDays} day(s).`;
  }

  function cancelBooking(requestId: string): void {
    const updatedAtIso = new Date().toISOString();
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: CustomerRequestStatus.CANCELLED, updatedAtIso }
          : request,
      ),
    );

    const all = listLocalCustomerRequests();
    const updated = all.map((request) =>
      request.id === requestId
        ? { ...request, status: CustomerRequestStatus.CANCELLED, updatedAtIso }
        : request,
    );

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_CUSTOMER_REQUESTS_KEY, JSON.stringify(updated));
    }
  }

  return (
    <DemoSitePageShell template={template} settings={settings}>
      <SiteCard
        title="Customer account bookings"
        subtitle="View upcoming bookings, history, and cancellation options for this site."
      >
        <p className="text-sm text-slate-700">
          This is the site-scoped customer bookings area connected to the public website.
        </p>
      </SiteCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Upcoming bookings" subtitle="Your next scheduled appointments.">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming bookings.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {upcoming.map((request) => (
                <li
                  key={request.id}
                  className="rounded-md border border-slate-200 bg-white px-2 py-2"
                >
                  <p>
                    {request.serviceName || "Service"} -{" "}
                    {formatUkDate(request.preferredDate || request.createdAtIso)}
                    {request.preferredTime ? ` at ${request.preferredTime}` : ""}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-rose-700 underline"
                    onClick={() => cancelBooking(request.id)}
                  >
                    Cancel booking
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-600">{cancellationPolicyNote()}</p>
        </SiteCard>

        <SiteCard
          title="Booking history"
          subtitle="Completed and cancelled appointments."
        >
          {history.length === 0 ? (
            <p className="text-sm text-slate-600">No booking history yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {history.map((request) => (
                <li key={request.id}>
                  {request.serviceName || "Service"} - {request.status} (
                  {formatUkDateTime(request.updatedAtIso)})
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>
    </DemoSitePageShell>
  );
}
