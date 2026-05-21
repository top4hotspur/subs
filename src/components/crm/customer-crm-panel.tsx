"use client";

import { useMemo, useState } from "react";
import { CustomerRecord } from "@/lib/crm/customer-types";
import { getCustomerBookingHistory, updateLocalCustomer } from "@/lib/crm/local-customers";
import { CustomerRequest } from "@/lib/requests/request-types";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { customerRequestStatusLabel, formatUkDateTime } from "@/lib/ui/display-labels";

type CustomerCrmPanelProps = {
  customers: CustomerRecord[];
  requests: CustomerRequest[];
  onRefresh: () => void;
  onBuildFromRequests: () => void;
};

export function CustomerCrmPanel({ customers, requests, onRefresh, onBuildFromRequests }: CustomerCrmPanelProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id ?? "");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const [notes, setNotes] = useState(selectedCustomer?.notes ?? "");
  const [tags, setTags] = useState((selectedCustomer?.tags ?? []).join(", "));

  const history = useMemo(() => {
    if (!selectedCustomer) return [];
    return getCustomerBookingHistory(selectedCustomer.id, requests);
  }, [selectedCustomer, requests]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Customer CRM</h2>
        <div className="flex gap-2">
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onBuildFromRequests}>Build CRM from local requests</button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onRefresh}>Reload</button>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-600">Local-only customer records for demo purposes. No real backend CRM yet.</p>

      {customers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No local customers yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-2">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  setNotes(customer.notes ?? "");
                  setTags((customer.tags ?? []).join(", "));
                }}
                className={`w-full rounded-lg border p-3 text-left ${selectedCustomerId === customer.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}
              >
                <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-600">{customer.email || "No email"}</p>
                <p className="text-xs text-slate-600">{customer.phone || "No phone"}</p>
                <p className="mt-1 text-xs text-slate-700">Bookings: {customer.totalBookings} | Completed: {customer.totalCompletedBookings}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!selectedCustomer ? (
              <p className="text-sm text-slate-600">Select a customer to view booking history.</p>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Name:</span> {selectedCustomer.name}</p>
                  <p><span className="font-semibold">Last booking:</span> {selectedCustomer.lastBookingAtIso ? formatUkDateTime(selectedCustomer.lastBookingAtIso) : "N/A"}</p>
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
                        <p>{item.preferredDate || "Date TBC"} {item.preferredTime || "Time TBC"} - {customerRequestStatusLabel(item.status)}</p>
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
