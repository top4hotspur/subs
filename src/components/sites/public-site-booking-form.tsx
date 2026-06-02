"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPublicSiteBooking } from "@/lib/sites/public-site-bookings-client";

type PublicSiteBookingFormProps = {
  siteSlug: string;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    active: boolean;
  }>;
  staff: Array<{
    id: string;
    displayName: string;
    roleLabel: string | null;
    customerSelectable: boolean;
    active: boolean;
  }>;
};

function toErrorMessage(error: string, status: number): string {
  if (error === "BOOKING_SLOT_CONFLICT" || status === 409) {
    return "That preferred slot is no longer available. Please choose another date/time.";
  }
  if (error === "VALIDATION_ERROR" || status === 400) {
    return "Please confirm that you have read and accepted the booking and cancellation policy.";
  }
  if (error === "SITE_NOT_FOUND" || status === 404) {
    return "This site is not available.";
  }
  return "Could not confirm booking right now.";
}

export function PublicSiteBookingForm({ siteSlug, services, staff }: PublicSiteBookingFormProps) {
  const activeServices = useMemo(() => services.filter((item) => item.active), [services]);
  const selectableStaff = useMemo(
    () => staff.filter((item) => item.active && item.customerSelectable),
    [staff],
  );

  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(): Promise<void> {
    setSaving(true);
    setMessage("Confirming booking...");

    const selectedService = activeServices.find((item) => item.id === serviceId);
    const selectedStaff = selectableStaff.find((item) => item.id === staffMemberId);

    const result = await createPublicSiteBooking(siteSlug, {
      serviceId: selectedService?.id,
      serviceName: selectedService?.name,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      preferredDate: preferredDate.trim() || undefined,
      preferredTime: preferredTime.trim() || undefined,
      staffMemberId: selectedStaff?.id || undefined,
      staffName: selectedStaff?.displayName || undefined,
      notes: notes.trim() || undefined,
      policyAccepted,
    });

    if (!result.ok) {
      setMessage(toErrorMessage(result.error, result.status));
      setSaving(false);
      return;
    }

    setMessage("Your booking has been confirmed.");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setPreferredDate("");
    setPreferredTime("");
    setStaffMemberId("");
    setNotes("");
    setPolicyAccepted(false);
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Book appointment</h2>
      <p className="mt-2 text-sm text-slate-600">
        Choose a service and time to confirm your booking. No payment is taken online yet.
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
          Your name
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Phone
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
        <p className="w-full text-sm text-slate-600">
          Please read the booking and cancellation policy before submitting your booking.
        </p>
        <label className="flex w-full items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} />
          <span>
            I have read and accept the{" "}
            <Link href={`/sites/${encodeURIComponent(siteSlug)}/policy`} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 underline">
              booking and cancellation policy
            </Link>.
          </span>
        </label>
        <button
          type="button"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          onClick={() => {
            void submit();
          }}
          disabled={saving}
        >
          {saving ? "Confirming..." : "Confirm booking"}
        </button>
        <Link
          href={`/sites/${encodeURIComponent(siteSlug)}`}
          className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Back to site
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
