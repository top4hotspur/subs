"use client";

import { useMemo } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { WebsiteTemplate } from "@/lib/sites/types";
import { formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";
import { listLocalVouchers } from "@/lib/vouchers/local-vouchers";

type DemoAccountPageProps = {
  template: WebsiteTemplate;
};

export function DemoAccountPage({ template }: DemoAccountPageProps) {
  const requests = useMemo(
    () => listLocalCustomerRequests().filter((request) => request.templateSlug === template.slug),
    [template.slug],
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
  const vouchers = useMemo(() => listLocalVouchers(template.slug), [template.slug]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Customer account</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-200">
          Manage upcoming bookings, booking history, profile details, payment preferences, and gift vouchers.
        </p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Upcoming bookings" subtitle="Your next scheduled appointments.">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming bookings.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {upcoming.map((request) => (
                <li key={request.id}>
                  {request.serviceName || "Service"} - {formatUkDate(request.preferredDate || request.createdAtIso)}
                  {request.preferredTime ? ` at ${request.preferredTime}` : ""}
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
        <SiteCard title="Booking history" subtitle="Completed and cancelled appointments.">
          {history.length === 0 ? (
            <p className="text-sm text-slate-600">No booking history yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {history.map((request) => (
                <li key={request.id}>
                  {request.serviceName || "Service"} - {request.status} ({formatUkDateTime(request.updatedAtIso)})
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Personal details" subtitle="Keep your contact details up to date.">
          <p className="text-sm text-slate-700">Name, email and mobile details are managed in your profile settings.</p>
        </SiteCard>
        <SiteCard title="Payment methods" subtitle="Secure card storage and billing history.">
          <p className="text-sm text-slate-700">Saved cards and receipts appear here once payment processing is enabled.</p>
        </SiteCard>
      </div>

      <SiteCard title="Gift vouchers" subtitle="Track issued and redeemed vouchers.">
        {vouchers.length === 0 ? (
          <p className="text-sm text-slate-600">No vouchers linked to this account yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {vouchers.map((voucher) => (
              <li key={voucher.id}>
                {voucher.voucherCode} - £{voucher.valueGbp.toFixed(2)} - {voucher.status}
              </li>
            ))}
          </ul>
        )}
      </SiteCard>
    </main>
  );
}

