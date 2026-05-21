"use client";

import { useMemo, useState } from "react";
import {
  createLocalCustomerRequest,
  listLocalCustomerRequests,
} from "@/lib/requests/local-customer-requests";
import {
  CustomerRequestCommunicationChannel,
  CustomerRequestKind,
  CustomerRequestLocationType,
  CustomerRequestPricingStatus,
} from "@/lib/requests/request-types";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { listLocalStaff } from "@/lib/staff/local-staff";
import {
  outlineButtonClass,
  primaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";

type Props = {
  onCreated?: () => void;
};

const APPOINTMENT_INDUSTRIES: WebsiteTemplateSlug[] = [
  "barbers",
  "hairdressers",
  "nail-salon",
  "beauticians",
  "massage",
  "dog-grooming",
];

function buildMockLink(requestId: string): string {
  return `/account?request=${requestId}&action=complete-registration-payment`;
}

export function StaffAssistedBookingForm({ onCreated }: Props) {
  const [industrySlug, setIndustrySlug] = useState<WebsiteTemplateSlug>("barbers");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    customerName: string;
    serviceName: string;
    preferredDate: string;
    preferredTime: string;
    link: string;
  } | null>(null);

  const activeIndustry = APPOINTMENT_INDUSTRIES.includes(industrySlug) ? industrySlug : "barbers";

  const services = useMemo(() => {
    const template = getWebsiteTemplate(activeIndustry);
    if (!template) return [];
    const settings = getLocalCustomerSiteSettings(activeIndustry, template);
    return settings.services.filter((service) => service.active);
  }, [activeIndustry]);

  const staffMembers = useMemo(
    () => listLocalStaff(activeIndustry).filter((staff) => staff.active),
    [activeIndustry],
  );

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedStaff = staffMembers.find((staff) => staff.id === staffId);

  function clearForm() {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setServiceId("");
    setStaffId("");
    setPreferredDate("");
    setPreferredTime("");
    setNotes("");
  }

  function submit() {
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!customerEmail.trim() && !customerPhone.trim()) {
      setError("Customer email or phone is required.");
      return;
    }
    if (!serviceId) {
      setError("Service is required.");
      return;
    }
    if (!preferredDate || !preferredTime) {
      setError("Booking date and time are required.");
      return;
    }

    const draftRequest = createLocalCustomerRequest({
      templateSlug: activeIndustry,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      kind: CustomerRequestKind.BOOKING_REQUEST,
      pricingStatus: CustomerRequestPricingStatus.PAYMENT_PENDING,
      serviceId,
      serviceName: selectedService?.name,
      preferredDate,
      preferredTime,
      locationType: CustomerRequestLocationType.BUSINESS_PREMISES,
      preferredStaffId: selectedStaff?.id,
      preferredStaffName: selectedStaff?.displayName,
      assignedStaffId: selectedStaff?.id,
      assignedStaffName: selectedStaff?.displayName,
      notes: notes.trim() || undefined,
      createdByStaff: true,
      customerRegistrationRequired: true,
      paymentRequired: true,
      mockRegistrationPaymentLink: "pending",
      communicationChannels: [CustomerRequestCommunicationChannel.EMAIL],
    });

    const link = buildMockLink(draftRequest.id);
    const requests = listLocalCustomerRequests();
    const target = requests.find((request) => request.id === draftRequest.id);
    if (target) {
      target.mockRegistrationPaymentLink = link;
      target.updatedAtIso = new Date().toISOString();
      window.localStorage.setItem("subs-customer-requests", JSON.stringify(requests));
    }

    setSuccess({
      customerName: customerName.trim(),
      serviceName: selectedService?.name ?? "Appointment service",
      preferredDate,
      preferredTime,
      link,
    });
    setError(null);
    clearForm();
    onCreated?.();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Staff-assisted booking</h2>
      <p className="mt-1 text-xs text-slate-600">
        Local mock flow for phone-in bookings. In live mode, this would trigger registration and payment completion.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Industry
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={activeIndustry}
            onChange={(event) => {
              setIndustrySlug(event.target.value as WebsiteTemplateSlug);
              setServiceId("");
              setStaffId("");
            }}
          >
            {APPOINTMENT_INDUSTRIES.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Service
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Customer name
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Customer full name"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Customer email
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="customer@email.com"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Customer phone
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="07123 456789"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Staff member (optional)
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            <option value="">Business will allocate</option>
            {staffMembers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Booking date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={preferredDate}
            onChange={(event) => setPreferredDate(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Booking time
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={preferredTime}
            onChange={(event) => setPreferredTime(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Notes
          <textarea
            className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Phone-in context, customer preferences, anything important"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-xs font-medium text-rose-700">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={submit}>
          Create local booking
        </button>
        <button
          type="button"
          className={`${outlineButtonClass} ${smallButtonClass}`}
          onClick={() => {
            clearForm();
            setError(null);
          }}
        >
          Clear
        </button>
      </div>

      {success ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Booking created locally</p>
          <p className="mt-1">To: {success.customerName}</p>
          <p>Service: {success.serviceName}</p>
          <p>
            Date/time: {success.preferredDate} {success.preferredTime}
          </p>
          <p className="mt-2 font-semibold">Mock registration/payment email preview</p>
          <p>Hello {success.customerName}, your booking is held pending account setup and payment completion.</p>
          <p className="mt-1">Complete registration and payment: {success.link}</p>
          <p className="mt-2">In the live version this email would let the customer set a password and pay for the booking.</p>
        </div>
      ) : null}
    </section>
  );
}
