"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomerRecord } from "@/lib/crm/customer-types";
import { clearLocalCustomers, getCustomerBookingHistory, updateLocalCustomer } from "@/lib/crm/local-customers";
import { customerHistoryToCsv, crmCustomersToCsv, downloadCsv } from "@/lib/export/local-csv";
import { CustomerRequest } from "@/lib/requests/request-types";
import { WEBSITE_TEMPLATE_SLUGS, WebsiteTemplateSlug } from "@/lib/sites/types";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { customerRequestStatusLabel, formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";

type CustomerCrmPanelProps = {
  customers: CustomerRecord[];
  requests: CustomerRequest[];
  onRefresh: () => void;
  onBuildFromRequests: () => void;
  showBackToAdminLink?: boolean;
};

export function CustomerCrmPanel({
  customers,
  requests,
  onRefresh,
  onBuildFromRequests,
  showBackToAdminLink = false,
}: CustomerCrmPanelProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<"ALL" | WebsiteTemplateSlug>("ALL");

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return customers
      .filter((customer) => {
        const matchesSearch =
          query.length === 0 ||
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query);

        if (!matchesSearch) return false;
        if (industryFilter === "ALL") return true;

        const history = getCustomerBookingHistory(customer.id, requests);
        return history.some((item) => item.industrySlug === industryFilter);
      })
      .sort((a, b) => {
        const aTime = a.lastBookingAtIso ? new Date(a.lastBookingAtIso).getTime() : 0;
        const bTime = b.lastBookingAtIso ? new Date(b.lastBookingAtIso).getTime() : 0;
        return bTime - aTime;
      });
  }, [customers, searchQuery, industryFilter, requests]);

  const selectedCustomer =
    filteredCustomers.find((c) => c.id === selectedCustomerId) ?? filteredCustomers[0] ?? null;
  const [notes, setNotes] = useState(selectedCustomer?.notes ?? "");
  const [tags, setTags] = useState((selectedCustomer?.tags ?? []).join(", "));

  const history = useMemo(() => {
    if (!selectedCustomer) return [];
    return getCustomerBookingHistory(selectedCustomer.id, requests);
  }, [selectedCustomer, requests]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Customer CRM</h2>
          <p className="mt-1 text-xs text-slate-600">Local-only customer records for demo purposes. No real backend CRM yet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showBackToAdminLink ? <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>Back to admin</Link> : null}
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onBuildFromRequests}>Build CRM from local requests</button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onRefresh}>Reload</button>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={() => {
              if (!window.confirm("Clear all local CRM customers in this browser?")) return;
              clearLocalCustomers();
              onRefresh();
            }}
          >
            Clear local CRM
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
        <label className="text-xs text-slate-700">
          Search (name, email, phone)
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search customer"
          />
        </label>
        <label className="text-xs text-slate-700">
          Industry filter
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            value={industryFilter}
            onChange={(event) => setIndustryFilter(event.target.value as "ALL" | WebsiteTemplateSlug)}
          >
            <option value="ALL">All industries</option>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{slug}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={() => downloadCsv("crm-customers.csv", crmCustomersToCsv(filteredCustomers))}
          >
            Export customers CSV
          </button>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No local customers match this filter yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-2">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  setNotes(customer.notes ?? "");
                  setTags((customer.tags ?? []).join(", "));
                }}
                className={`w-full rounded-lg border p-3 text-left ${selectedCustomer?.id === customer.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}
              >
                <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-600">{customer.email || "No email"}</p>
                <p className="text-xs text-slate-600">{customer.phone || "No phone"}</p>
                <p className="mt-1 text-xs text-slate-700">Bookings: {customer.totalBookings} | Completed: {customer.totalCompletedBookings}</p>
                <p className="mt-1 text-[11px] text-slate-500">Last booking: {customer.lastBookingAtIso ? formatUkDateTime(customer.lastBookingAtIso) : "N/A"}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!selectedCustomer ? (
              <p className="text-sm text-slate-600">Select a customer to view booking history.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                    <p><span className="font-semibold">Name:</span> {selectedCustomer.name}</p>
                    <p><span className="font-semibold">Last booking:</span> {selectedCustomer.lastBookingAtIso ? formatUkDateTime(selectedCustomer.lastBookingAtIso) : "N/A"}</p>
                  </div>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => downloadCsv(`crm-history-${selectedCustomer.name.replaceAll(" ", "-").toLowerCase()}.csv`, customerHistoryToCsv(history))}
                  >
                    Export history CSV
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-slate-700">Notes
                    <textarea className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </label>
                  <label className="text-xs text-slate-700">Tags (comma separated)
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} />
                  </label>
                </div>
                <button
                  type="button"
                  className={`mt-2 ${primaryButtonClass} ${smallButtonClass}`}
                  onClick={() => {
                    updateLocalCustomer(selectedCustomer.id, {
                      notes,
                      tags: tags.split(",").map((v) => v.trim()).filter(Boolean),
                    });
                    onRefresh();
                  }}
                >
                  Save customer notes/tags
                </button>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">Booking history</h3>
                {history.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-600">No booking history yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs text-slate-700">
                    {history.map((item) => (
                      <li key={item.requestId} className="rounded-md border border-slate-200 bg-white p-2">
                        <p className="font-medium">{item.serviceName || "Service TBC"}</p>
                        <p>{item.preferredDate ? formatUkDate(item.preferredDate) : "Date TBC"} {item.preferredTime || "Time TBC"} - {customerRequestStatusLabel(item.status)}</p>
                        <p className="text-[11px] text-slate-500">Industry: {item.industrySlug}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
