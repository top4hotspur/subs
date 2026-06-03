"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPublicSiteBooking } from "@/lib/sites/public-site-bookings-client";
import { getCustomerSiteBookingPaymentDecision } from "@/lib/sites/customer-site-payment-policy";

type PublicSiteBookingFormProps = {
  siteSlug: string;
  publicBasePath?: string;
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
  acceptCashPayments?: boolean;
  acceptCardPayments?: boolean;
  requireBookingPrepayment?: boolean;
  allowInStorePaymentRecording?: boolean;
  paymentProviderConnected?: boolean;
  paymentProviderCheckoutEnabled?: boolean;
};

type CustomerSessionResponse = {
  ok?: boolean;
  customer?: {
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
};

function toErrorMessage(error: string, status: number): string {
  if (error === "BOOKING_SLOT_CONFLICT" || status === 409) {
    return "That preferred slot is no longer available. Please choose another date/time.";
  }
  if (error === "ONLINE_PAYMENT_NOT_CONFIGURED") {
    return "This business requires payment before online booking, but online payment is not connected yet. Please contact the business to book.";
  }
  if (error === "BOOKING_PAYMENT_METHOD_UNAVAILABLE") {
    return "This business does not currently have a payment method available for online booking. Please contact the business to book.";
  }
  if (error === "BOOKING_PAYMENT_AMOUNT_REQUIRED") {
    return "This service requires a quote before online payment can be taken.";
  }
  if (error === "BOOKING_CHECKOUT_SESSION_FAILED") {
    return "We could not start secure payment. Please contact the business to book.";
  }
  if (error === "VALIDATION_ERROR" || status === 400) {
    return "Please confirm that you have read and accepted the booking and cancellation policy.";
  }
  if (error === "SITE_NOT_FOUND" || status === 404) {
    return "This site is not available.";
  }
  return "Could not confirm booking right now.";
}

export function PublicSiteBookingForm({
  siteSlug,
  publicBasePath,
  services,
  staff,
  acceptCashPayments = false,
  acceptCardPayments = true,
  requireBookingPrepayment = false,
  allowInStorePaymentRecording = false,
  paymentProviderConnected = false,
  paymentProviderCheckoutEnabled = false,
}: PublicSiteBookingFormProps) {
  const siteBasePath = publicBasePath ?? `/sites/${encodeURIComponent(siteSlug)}`;
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
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usingAccountDetails, setUsingAccountDetails] = useState(false);
  const paymentDecision = useMemo(
    () => getCustomerSiteBookingPaymentDecision({
      acceptCashPayments,
      acceptCardPayments,
      requireBookingPrepayment,
      allowInStorePaymentRecording,
      paymentProviderConnected,
      paymentProviderCheckoutEnabled,
    }),
    [acceptCashPayments, acceptCardPayments, requireBookingPrepayment, allowInStorePaymentRecording, paymentProviderConnected, paymentProviderCheckoutEnabled],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCustomerSession() {
      const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/account/session`, {
        cache: "no-store",
      }).catch(() => null);
      if (!response?.ok) return;
      const body = (await response.json().catch(() => null)) as CustomerSessionResponse | null;
      const customer = body?.customer;
      if (cancelled || !customer) return;
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
      setCustomerName((current) => current || fullName);
      setCustomerEmail((current) => current || customer.email);
      setCustomerPhone((current) => current || customer.phone || "");
      setUsingAccountDetails(true);
    }
    void loadCustomerSession();
    return () => {
      cancelled = true;
    };
  }, [siteSlug]);

  async function submit(): Promise<void> {
    if (!paymentDecision.canCreateBooking) {
      setMessage(paymentDecision.publicCopy);
      return;
    }
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
    if (result.checkoutUrl) {
      setMessage("Booking created. Redirecting to secure payment...");
      window.location.assign(result.checkoutUrl);
      return;
    }

    setMessage("Your booking has been confirmed.");
    setBookingConfirmed(true);
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
        Choose a service and time to confirm your booking.
      </p>
      <p className={`mt-3 rounded-md border px-3 py-2 text-sm ${
        paymentDecision.canCreateBooking
          ? "border-slate-200 bg-slate-50 text-slate-700"
          : "border-amber-200 bg-amber-50 font-semibold text-amber-950"
      }`}>
        {paymentDecision.publicCopy}
      </p>
      {usingAccountDetails ? (
        <p className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-950">
          Using your saved customer account details. You can edit them for this booking if needed.
        </p>
      ) : null}

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
            <Link href={`${siteBasePath}/policy`} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 underline">
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
          disabled={saving || !paymentDecision.canCreateBooking}
        >
          {saving ? "Confirming..." : "Confirm booking"}
        </button>
        <Link
          href={siteBasePath || "/"}
          className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Back to site
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {bookingConfirmed ? (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          <p className="font-semibold">
            {usingAccountDetails ? "This booking has been added to your account." : "Want to manage your bookings more easily?"}
          </p>
          {!usingAccountDetails ? (
            <>
              <p className="mt-1">
                Create an account using the same email address and you&apos;ll be able to view your bookings, keep your details handy and receive offers from this business if you choose to opt in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`${siteBasePath}/account/register`} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                  Create account
                </Link>
                <Link href={`${siteBasePath}/account/login`} className="rounded-md border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-950">
                  Login
                </Link>
                <button type="button" className="rounded-md border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-950" onClick={() => setBookingConfirmed(false)}>
                  Continue without account
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
