"use client";

import { useMemo, useRef, useState } from "react";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { createPublicSiteBooking } from "@/lib/sites/public-site-bookings-client";
import { formatBookingDateTime } from "@/lib/sites/customer-site-booking-display";

type PublicAvailabilityStaff = {
  id: string;
  displayName: string;
  customerSelectable: boolean;
};

type PublicAvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
  staffMemberId: string;
  staffName: string;
  serviceId: string;
};

type AvailabilityResponse = {
  ok?: boolean;
  serviceId?: string;
  staffId?: string | null;
  anyStaff?: boolean;
  date?: string;
  slots?: PublicAvailabilitySlot[];
  message?: string;
  error?: string;
};

type PublicSiteAvailabilityPreviewProps = {
  siteSlug: string;
  serviceId: string;
  serviceName: string;
  staff: PublicAvailabilityStaff[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toErrorMessage(error: string, status: number): string {
  if (error === "BOOKING_SLOT_CONFLICT" || error === "BOOKING_SLOT_UNAVAILABLE" || status === 409) {
    return "That slot is no longer available. Please choose another time.";
  }
  if (error === "VALIDATION_ERROR" || status === 400) {
    return "Please confirm that you have read and accepted the booking and cancellation policy.";
  }
  return "Could not send booking request right now.";
}

export function PublicSiteAvailabilityPreview({
  siteSlug,
  serviceId,
  serviceName,
  staff,
}: PublicSiteAvailabilityPreviewProps) {
  const selectableStaff = useMemo(() => staff.filter((member) => member.customerSelectable), [staff]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const bookingFormRef = useRef<HTMLDivElement | null>(null);

  function selectSlot(slot: PublicAvailabilitySlot) {
    setSelectedSlot(slot);
    setSuccessMessage(null);
    window.setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      bookingFormRef.current?.focus({ preventScroll: true });
    }, 0);
  }

  function isSelectedSlot(slot: PublicAvailabilitySlot): boolean {
    return (
      selectedSlot?.date === slot.date &&
      selectedSlot?.startTime === slot.startTime &&
      selectedSlot?.staffMemberId === slot.staffMemberId
    );
  }

  async function checkAvailability() {
    setLoading(true);
    setSelectedSlot(null);
    setMessage("Checking availability...");
    try {
      const params = new URLSearchParams({ serviceId, date });
      if (staffId) params.set("staffId", staffId);
      const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/availability?${params.toString()}`);
      const body = (await response.json()) as AvailabilityResponse;
      if (!response.ok || !body.ok) {
        setSlots([]);
        setMessage(body.error ?? "Could not check availability right now.");
        return;
      }
      setSlots(body.slots ?? []);
      setMessage((body.slots?.length ?? 0) > 0 ? "Available times found." : "No available times found for this date. Please try another date.");
    } catch {
      setSlots([]);
      setMessage("Could not check availability right now.");
    } finally {
      setLoading(false);
    }
  }

  async function submitBookingRequest() {
    if (!selectedSlot) {
      setMessage("Choose an available time before confirming your booking.");
      return;
    }
    if (!policyAccepted) {
      setMessage("Please confirm that you have read and accepted the booking and cancellation policy.");
      return;
    }
    setSubmitting(true);
    setMessage("Confirming booking...");
    const result = await createPublicSiteBooking(siteSlug, {
      serviceId,
      serviceName,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      preferredDate: selectedSlot.date,
      preferredTime: selectedSlot.startTime,
      staffMemberId: selectedSlot.staffMemberId,
      staffName: selectedSlot.staffName,
      notes: customerNotes.trim() || undefined,
      policyAccepted,
    });
    setSubmitting(false);
    if (!result.ok) {
      setMessage(toErrorMessage(result.error, result.status));
      return;
    }
    const appointment = formatBookingDateTime({
      preferredDate: selectedSlot.date,
      preferredTime: selectedSlot.startTime,
      startDateTime: null,
    });
    setSuccessMessage(
      `Your booking has been confirmed. ${serviceName} at ${appointment}${selectedSlot.staffName ? ` with ${selectedSlot.staffName}` : ""}.`,
    );
    setMessage(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerNotes("");
    setPolicyAccepted(false);
    setSelectedSlot(null);
    await checkAvailability();
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        className={`${primaryButtonClass} ${smallButtonClass}`}
        onClick={() => {
          setOpen((current) => !current);
          if (!open && slots.length === 0 && !message) void checkAvailability();
        }}
      >
        {open ? "Hide available times" : "Check availability"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelectedSlot(null);
                  setSlots([]);
                }}
              />
            </label>
            {selectableStaff.length > 0 ? (
              <label className="text-xs font-semibold text-slate-700">
                Staff member
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={staffId}
                  onChange={(event) => {
                    setStaffId(event.target.value);
                    setSelectedSlot(null);
                    setSlots([]);
                  }}
                >
                  <option value="">Any available staff</option>
                  {selectableStaff.map((member) => (
                    <option key={member.id} value={member.id}>{member.displayName}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void checkAvailability()} disabled={loading}>
            {loading ? "Checking..." : `View times for ${serviceName}`}
          </button>
          {message ? <p className="text-xs text-slate-600">{message}</p> : null}
          {slots.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.slice(0, 24).map((slot) => {
                const selected = isSelectedSlot(slot);
                return (
                <button
                  key={`${slot.staffMemberId}-${slot.startTime}`}
                  type="button"
                  className={
                    selected
                      ? "rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-left text-xs font-semibold text-emerald-950 shadow-sm ring-2 ring-emerald-200"
                      : "rounded-md border border-teal-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:border-teal-400 hover:bg-teal-50"
                  }
                  onClick={() => selectSlot(slot)}
                >
                  <span className="block">{slot.startTime}-{slot.endTime}</span>
                  {staffId ? <span className="block font-normal text-slate-500">{slot.staffName}</span> : null}
                </button>
                );
              })}
            </div>
          ) : null}
          {selectedSlot ? (
            <div ref={bookingFormRef} tabIndex={-1} className="scroll-mt-6 rounded-lg border border-teal-200 bg-white p-3 outline-none focus:ring-2 focus:ring-teal-200">
              <p className="text-sm font-semibold text-slate-900">
                Confirm {selectedSlot.startTime}-{selectedSlot.endTime}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Complete your details to confirm this booking. No payment is taken online yet.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Your name
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Email
                  <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Phone
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Notes (optional)
                  <textarea className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Please read the booking and cancellation policy before submitting your booking.
              </p>
              <label className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                <input type="checkbox" className="mt-0.5" checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} />
                <span>
                  I have read and accept the{" "}
                  <a href={`/sites/${encodeURIComponent(siteSlug)}/policy`} className="font-semibold text-teal-700 underline">
                    booking and cancellation policy
                  </a>.
                </span>
              </label>
              <button
                type="button"
                className={`mt-3 ${primaryButtonClass} ${smallButtonClass}`}
                onClick={() => void submitBookingRequest()}
                disabled={submitting}
              >
                {submitting ? "Confirming..." : "Confirm booking"}
              </button>
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
              {successMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
