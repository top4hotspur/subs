"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  createPersistedBooking,
  listPersistedBookings,
  updatePersistedBookingStatus,
} from "@/lib/sites/admin-site-bookings-client";
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type BookingFormProps = {
  siteId: string;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    basePrice: number | null;
    durationMinutes: number | null;
    active: boolean;
  }>;
  staff: Array<{
    id: string;
    displayName: string;
    roleLabel: string | null;
    customerSelectable: boolean;
    active: boolean;
  }>;
  initialBookings: CustomerSiteBookingRecord[];
};

function messageForError(error: string, status: number): string {
  if (error === "BOOKING_SLOT_CONFLICT" || status === 409) {
    return "That staff/date/time slot is already booked. Choose another slot.";
  }
  if (error === "VALIDATION_ERROR" || status === 400) {
    return "Please check your booking fields and try again.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Platform admin session required.";
  }
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured.";
  }
  return `Booking request failed: ${error}`;
}

export function PersistedSiteBookingForm({
  siteId,
  services,
  staff,
  initialBookings,
}: BookingFormProps) {
  const selectableStaff = useMemo(
    () => staff.filter((item) => item.active && item.customerSelectable),
    [staff],
  );
  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services],
  );

  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState(initialBookings);

  async function refreshBookings(): Promise<void> {
    const result = await listPersistedBookings(siteId, { take: 20 });
    if (result.ok) {
      setBookings(result.bookings);
    }
  }

  async function submitBooking(): Promise<void> {
    setSaving(true);
    setMessage("Saving booking...");

    const selectedService = activeServices.find((service) => service.id === serviceId);
    const selectedStaff = selectableStaff.find((item) => item.id === staffMemberId);

    const result = await createPersistedBooking(siteId, {
      serviceId: selectedService?.id || undefined,
      serviceName: selectedService?.name || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      preferredDate: preferredDate.trim() || undefined,
      preferredTime: preferredTime.trim() || undefined,
      staffMemberId: selectedStaff?.id || undefined,
      staffName: selectedStaff?.displayName || undefined,
      notes: notes.trim() || undefined,
      source: "preview",
      status: "REQUESTED",
      paymentStatus: "NOT_REQUIRED",
      policyAccepted: true,
    });

    if (!result.ok) {
      setMessage(messageForError(result.error, result.status));
      setSaving(false);
      return;
    }

    setMessage("Booking request saved to persisted TenantSite records.");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setPreferredDate("");
    setPreferredTime("");
    setStaffMemberId("");
    setNotes("");
    await refreshBookings();
    setSaving(false);
  }

  async function markCancelled(bookingId: string): Promise<void> {
    const result = await updatePersistedBookingStatus(siteId, bookingId, {
      status: "CANCELLED",
    });
    if (!result.ok) {
      setMessage(messageForError(result.error, result.status));
      return;
    }
    setMessage("Booking marked cancelled.");
    await refreshBookings();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Book from persisted preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          This form creates persisted booking/request records for this TenantSite. No payment or email sending is active in this pass.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Service
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              <option value="">Select service</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Preferred staff (optional)
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={staffMemberId}
              onChange={(event) => setStaffMemberId(event.target.value)}
            >
              <option value="">No preference</option>
              {selectableStaff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Customer name
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Customer email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Customer phone
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Preferred date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Preferred time
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Notes (optional)
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={() => {
              void submitBooking();
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save persisted booking request"}
          </button>
          <Link href={`/admin/sites/${encodeURIComponent(siteId)}/preview`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to persisted preview
          </Link>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Recent persisted bookings</h3>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No persisted bookings yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{booking.customerName}</p>
                <p className="text-slate-600">
                  {booking.serviceName || "Service"} | {booking.preferredDate || "Date TBD"} {booking.preferredTime || ""}
                </p>
                <p className="text-slate-600">
                  Staff: {booking.staffName || "Unassigned"} | Status: {booking.status}
                </p>
                <p className="text-slate-600">
                  Payment: {booking.paymentStatus || "PAYMENT_REQUIRED"}
                </p>
                {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      void markCancelled(booking.id);
                    }}
                  >
                    Mark cancelled
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
