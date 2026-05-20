"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  shouldUseFixedSlotsByDefault,
  shouldUseFlexibleWindowsByDefault,
} from "@/lib/calendar/industry-calendar-defaults";
import {
  AppointmentSlotPreference,
  buildPreferredAppointmentSlots,
  DayPeriod,
} from "@/lib/calendar/appointment-slot-preferences";
import {
  getStaffAvailability,
  listLocalBusinessAvailability,
} from "@/lib/calendar/local-availability";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import {
  getDefaultLocationTypeForIndustry,
  getDefaultRequestKindForIndustry,
  getRequestActionLabelForIndustry,
  getSuggestedRequestFieldsForIndustry,
} from "@/lib/requests/industry-request-defaults";
import { createLocalCustomerRequest } from "@/lib/requests/local-customer-requests";
import {
  CustomerRequestCommunicationChannel,
  CustomerRequestKind,
  CustomerRequestLocationType,
  CustomerRequestPricingStatus,
} from "@/lib/requests/request-types";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { DemoSiteService, WebsiteTemplateSlug } from "@/lib/sites/types";
import { shouldCustomersSelectStaffByDefault } from "@/lib/staff/industry-staff-defaults";
import { StaffMember } from "@/lib/staff/staff-types";
import { primaryButtonClass } from "@/lib/ui/button-styles";
import {
  customerRequestKindLabel,
  customerRequestLocationTypeLabel,
  customerRequestPricingStatusLabel,
  weekdayLabel,
} from "@/lib/ui/display-labels";

type CustomerRequestFormProps = {
  templateSlug: WebsiteTemplateSlug;
  services?: DemoSiteService[];
  staffMembers?: StaffMember[];
};

function availabilityHint(slug: WebsiteTemplateSlug): string {
  if (slug === "taxi") {
    return "The operator will confirm journey timing and price.";
  }
  if (shouldUseFlexibleWindowsByDefault(slug)) {
    return "The business will confirm an available visit window.";
  }
  if (shouldUseFixedSlotsByDefault(slug)) {
    return "Preferred date/time helps the business confirm an available slot.";
  }
  return "The business will confirm timing after reviewing your request.";
}

export function CustomerRequestForm({ templateSlug, services, staffMembers }: CustomerRequestFormProps) {
  const fallbackServices = getWebsiteTemplate(templateSlug)?.defaultConfig.services ?? [];
  const effectiveServices = services && services.length > 0 ? services : fallbackServices;
  const selectableStaff = useMemo(
    () => (staffMembers ?? []).filter((staff) => staff.active && staff.customerSelectable),
    [staffMembers],
  );
  const businessAvailabilityAll = useMemo(
    () =>
      typeof window === "undefined"
        ? []
        : listLocalBusinessAvailability(templateSlug)
            .filter((window) => window.active),
    [templateSlug],
  );
  const businessAvailabilityPreview = businessAvailabilityAll.slice(0, 3);

  const requestKind = getDefaultRequestKindForIndustry(templateSlug);
  const locationType = getDefaultLocationTypeForIndustry(templateSlug);
  const actionLabel = getRequestActionLabelForIndustry(templateSlug);
  const suggestions = getSuggestedRequestFieldsForIndustry(templateSlug).join(", ");
  const appointmentStyle = isAppointmentStyleIndustry(templateSlug);
  const customerSelectableByDefault = shouldCustomersSelectStaffByDefault(templateSlug);
  const pricingStatusLabel = customerRequestPricingStatusLabel(
    requestKind === CustomerRequestKind.BOOKING_REQUEST
      ? CustomerRequestPricingStatus.PRICE_CONFIRMED
      : CustomerRequestPricingStatus.QUOTE_REQUIRED,
  );
  const preferredStaffLabel = appointmentStyle ? "Preferred barber/stylist (optional)" : "Preferred staff member (optional)";

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceId: "",
    preferredDate: "",
    preferredTime: "",
    customerAddress: "",
    pickupAddress: "",
    destinationAddress: "",
    preferredStaffId: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectedServiceName(): string | undefined {
    return effectiveServices.find((service) => service.id === form.serviceId)?.name;
  }

  const selectedStaffMember = useMemo(
    () => selectableStaff.find((staff) => staff.id === form.preferredStaffId),
    [form.preferredStaffId, selectableStaff],
  );

  const preferredSlots = useMemo<AppointmentSlotPreference[]>(() => {
    if (!appointmentStyle || !form.preferredDate) {
      return [];
    }
    const staffAvailability = selectedStaffMember?.id
      ? getStaffAvailability(templateSlug, selectedStaffMember.id)
      : [];
    return buildPreferredAppointmentSlots({
      selectedDate: form.preferredDate,
      industrySlug: templateSlug,
      businessAvailabilityWindows: businessAvailabilityAll,
      selectedStaffAvailabilityWindows: staffAvailability,
      selectedStaffId: selectedStaffMember?.id,
      selectedStaffName: selectedStaffMember?.displayName,
      serviceDurationMinutes: 45,
    });
  }, [appointmentStyle, form.preferredDate, templateSlug, businessAvailabilityAll, selectedStaffMember]);

  const slotGroups = useMemo(
    () => ({
      [DayPeriod.MORNING]: preferredSlots.filter((slot) => slot.period === DayPeriod.MORNING),
      [DayPeriod.AFTERNOON]: preferredSlots.filter((slot) => slot.period === DayPeriod.AFTERNOON),
      [DayPeriod.EVENING]: preferredSlots.filter((slot) => slot.period === DayPeriod.EVENING),
    }),
    [preferredSlots],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {appointmentStyle ? "Book appointment request" : "Example customer request"}
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        {actionLabel}. Suggested fields: {suggestions}.
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Request type: {customerRequestKindLabel(requestKind)} • Location: {customerRequestLocationTypeLabel(locationType)}
      </p>
      <p className="mt-1 text-xs text-slate-600">{availabilityHint(templateSlug)}</p>
      {appointmentStyle ? (
        <p className="mt-1 text-xs text-slate-600">
          Choose a preferred time. The business will confirm availability.
        </p>
      ) : null}
      {appointmentStyle && businessAvailabilityPreview.length > 0 ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Availability hint</p>
          <ul className="mt-1 space-y-1">
            {businessAvailabilityPreview.map((window) => (
              <li key={window.id}>
                {weekdayLabel(window.weekday)}: {window.startTime}-{window.endTime}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {appointmentStyle && businessAvailabilityPreview.length === 0 ? (
        <p className="mt-1 text-xs text-slate-600">
          The business will confirm the final appointment time. Live slot booking/conflict checking is not enabled in this demo.
        </p>
      ) : null}
      {!customerSelectableByDefault ? (
        <p className="mt-1 text-xs text-slate-600">The business will allocate the right team member.</p>
      ) : null}

      {submitted ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Request saved in this browser. In the live version this would create a customer request record with pricing status {pricingStatusLabel}.
          <div className="mt-2">
            <Link href="/account" className="font-semibold underline">
              View in customer portal
            </Link>
          </div>
        </div>
      ) : null}

      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.customerName || !form.customerEmail || !form.customerPhone) {
            setError("Name, email, and phone are required.");
            return;
          }
          if (appointmentStyle && (!form.serviceId || !form.preferredDate || !form.preferredTime)) {
            setError("Service, preferred date, and preferred time are required for appointment requests.");
            return;
          }
          if (locationType === CustomerRequestLocationType.ROUTE && (!form.pickupAddress || !form.destinationAddress)) {
            setError("Pickup and destination are required.");
            return;
          }
          if (locationType === CustomerRequestLocationType.CUSTOMER_ADDRESS && !form.customerAddress) {
            setError("Address is required for this request type.");
            return;
          }

          createLocalCustomerRequest({
            templateSlug,
            customerName: form.customerName,
            customerEmail: form.customerEmail,
            customerPhone: form.customerPhone,
            kind: requestKind,
            pricingStatus:
              requestKind === CustomerRequestKind.BOOKING_REQUEST
                ? CustomerRequestPricingStatus.PRICE_CONFIRMED
                : CustomerRequestPricingStatus.QUOTE_REQUIRED,
            serviceId: form.serviceId || undefined,
            serviceName: selectedServiceName(),
            preferredDate: form.preferredDate || undefined,
            preferredTime: form.preferredTime || undefined,
            locationType,
            customerAddress: form.customerAddress || undefined,
            pickupAddress: form.pickupAddress || undefined,
            destinationAddress: form.destinationAddress || undefined,
            notes: form.notes || undefined,
            preferredStaffId: selectedStaffMember?.id,
            preferredStaffName: selectedStaffMember?.displayName,
            communicationChannels: [CustomerRequestCommunicationChannel.EMAIL],
          });
          setSubmitted(true);
          setError(null);
        }}
      >
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer name" value={form.customerName} onChange={(event) => setForm((c) => ({ ...c, customerName: event.target.value }))} />
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer email" value={form.customerEmail} onChange={(event) => setForm((c) => ({ ...c, customerEmail: event.target.value }))} />
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer phone" value={form.customerPhone} onChange={(event) => setForm((c) => ({ ...c, customerPhone: event.target.value }))} />
        <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.serviceId} onChange={(event) => setForm((c) => ({ ...c, serviceId: event.target.value }))}>
          <option value="">{appointmentStyle ? "Select appointment service" : "Select service"}</option>
          {effectiveServices.map((service) => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
        <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.preferredDate} onChange={(event) => setForm((c) => ({ ...c, preferredDate: event.target.value }))} />
        {appointmentStyle ? (
          <div className="sm:col-span-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Preferred time</p>
            {!form.preferredDate ? (
              <p className="mt-1 text-xs text-slate-600">Choose a preferred date first to see suggested time tiles.</p>
            ) : null}
            {form.preferredDate ? (
              <div className="mt-2 space-y-3">
                {[
                  { key: DayPeriod.MORNING, label: "Morning" },
                  { key: DayPeriod.AFTERNOON, label: "Afternoon" },
                  { key: DayPeriod.EVENING, label: "Evening" },
                ].map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-medium text-slate-700">{group.label}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {slotGroups[group.key].length === 0 ? (
                        <span className="text-xs text-slate-500">No preferred slots in this period.</span>
                      ) : (
                        slotGroups[group.key].map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            className={`rounded-md border px-2 py-1 text-xs font-medium ${
                              form.preferredTime === slot.startTime
                                ? "border-sky-700 bg-sky-700 text-white"
                                : "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
                            }`}
                            onClick={() => setForm((c) => ({ ...c, preferredTime: slot.startTime }))}
                          >
                            {slot.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-slate-600">
              Selected preferred time: <span className="font-semibold text-slate-900">{form.preferredTime || "None selected"}</span>
            </p>
          </div>
        ) : (
          <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.preferredTime} onChange={(event) => setForm((c) => ({ ...c, preferredTime: event.target.value }))} />
        )}

        {selectableStaff.length > 0 ? (
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
            value={form.preferredStaffId}
            onChange={(event) => setForm((c) => ({ ...c, preferredStaffId: event.target.value }))}
          >
            <option value="">{preferredStaffLabel}</option>
            {selectableStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.displayName}
              </option>
            ))}
          </select>
        ) : null}

        {locationType === CustomerRequestLocationType.ROUTE ? (
          <>
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Pickup address" value={form.pickupAddress} onChange={(event) => setForm((c) => ({ ...c, pickupAddress: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Destination address" value={form.destinationAddress} onChange={(event) => setForm((c) => ({ ...c, destinationAddress: event.target.value }))} />
          </>
        ) : null}

        {locationType === CustomerRequestLocationType.CUSTOMER_ADDRESS ? (
          <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Service address" value={form.customerAddress} onChange={(event) => setForm((c) => ({ ...c, customerAddress: event.target.value }))} />
        ) : null}

        <textarea className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Notes" value={form.notes} onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))} />
        {error ? <p className="text-xs text-rose-700 sm:col-span-2">{error}</p> : null}
        <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>
          {appointmentStyle ? "Save local appointment request" : "Save local request"}
        </button>
      </form>
    </section>
  );
}
