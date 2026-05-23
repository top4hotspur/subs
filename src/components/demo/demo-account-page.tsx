"use client";

import { useMemo, useState } from "react";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import {
  getLocalCustomerProfile,
  saveLocalCustomerProfile,
} from "@/lib/demo/local-customer-profile";
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
  const [profile, setProfile] = useState(getLocalCustomerProfile());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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
        title="My Account"
        subtitle="Manage your contact details and view your bookings for this site."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            placeholder="Your name"
            value={profile.name}
            onChange={(event) =>
              setProfile((current) => ({ ...current, name: event.target.value }))
            }
          />
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            placeholder="Email"
            value={profile.email}
            onChange={(event) =>
              setProfile((current) => ({ ...current, email: event.target.value }))
            }
          />
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
            placeholder="Phone"
            value={profile.phone}
            onChange={(event) =>
              setProfile((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <div className="sm:col-span-2">
            <button
              type="button"
              className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800"
              onClick={() => {
                const next = saveLocalCustomerProfile({
                  name: profile.name,
                  email: profile.email,
                  phone: profile.phone,
                });
                setProfile(next);
                setSavedMessage("Account details saved.");
              }}
            >
              Save details
            </button>
            {savedMessage ? (
              <p className="mt-2 text-xs text-emerald-700">{savedMessage}</p>
            ) : null}
          </div>
        </div>
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
                  <p className="text-xs text-slate-600">
                    Staff: {request.preferredStaffName || "Unassigned"} | Payment:{" "}
                    {request.paymentStatus === "PAYMENT_COMPLETED"
                      ? "Payment Completed"
                      : "Requires Payment"}
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
                  {request.preferredStaffName
                    ? ` - Staff: ${request.preferredStaffName}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>
    </DemoSitePageShell>
  );
}
