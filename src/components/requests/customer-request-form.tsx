"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AppointmentSlotPreference,
  DayPeriod,
} from "@/lib/calendar/appointment-slot-preferences";
import { buildBookingDayAvailability } from "@/lib/calendar/booking-day-availability";
import {
  getStaffAvailability,
  listLocalBusinessAvailability,
} from "@/lib/calendar/local-availability";
import {
  listLocalBusinessClosures,
  listLocalStaffHolidays,
} from "@/lib/calendar/local-closures";
import { getLocalStaffRotaForStaff } from "@/lib/calendar/local-staff-rota";
import { getLocalCustomerProfile } from "@/lib/demo/local-customer-profile";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import {
  getAppointmentActionHeading,
  getAppointmentStaffLabel,
} from "@/lib/requests/appointment-industries";
import {
  flexibleJobAddressLabel,
  flexibleJobFrequencyOptions,
  flexibleJobHeading,
  flexibleJobServiceLabel,
  isFlexibleJobIndustry,
} from "@/lib/requests/flexible-job-industries";
import {
  isTaxiIndustry,
  taxiJourneyTypeOptions,
  taxiRequestHeading,
} from "@/lib/requests/taxi-request";
import {
  getDefaultLocationTypeForIndustry,
  getDefaultRequestKindForIndustry,
} from "@/lib/requests/industry-request-defaults";
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
import { DemoSiteService, WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import { primaryButtonClass } from "@/lib/ui/button-styles";
import { formatUkDate, weekdayLabel } from "@/lib/ui/display-labels";
import { ServiceTileSelector } from "@/components/requests/service-tile-selector";

type CustomerRequestFormProps = {
  templateSlug: WebsiteTemplateSlug;
  services?: DemoSiteService[];
  staffMembers?: StaffMember[];
  initialServiceId?: string;
};

function availabilityClass(level: "HIGH" | "LIMITED" | "LOW" | "NONE", selected: boolean): string {
  if (selected) return "border-sky-700 bg-sky-700 text-white";
  if (level === "HIGH") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (level === "LIMITED") return "border-orange-300 bg-orange-50 text-orange-900";
  if (level === "LOW") return "border-rose-300 bg-rose-50 text-rose-900";
  return "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";
}

export function CustomerRequestForm({ templateSlug, services, staffMembers, initialServiceId }: CustomerRequestFormProps) {
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
        : listLocalBusinessAvailability(templateSlug).filter((window) => window.active),
    [templateSlug],
  );
  const businessAvailabilityPreview = businessAvailabilityAll.slice(0, 3);
  const existingRequests = useMemo(
    () => (typeof window === "undefined" ? [] : listLocalCustomerRequests()),
    [],
  );
  const siteSettings = useMemo(() => {
    if (typeof window === "undefined") return null;
    const template = getWebsiteTemplate(templateSlug);
    if (!template) return null;
    return getLocalCustomerSiteSettings(templateSlug, template);
  }, [templateSlug]);

  const requestKind = getDefaultRequestKindForIndustry(templateSlug);
  const locationType = getDefaultLocationTypeForIndustry(templateSlug);
  const appointmentStyle = isAppointmentStyleIndustry(templateSlug);
  const flexibleJobStyle = isFlexibleJobIndustry(templateSlug);
  const taxiStyle = isTaxiIndustry(templateSlug);
  const allowCustomerStaffSelection =
    siteSettings?.appointmentSettings?.allowCustomerStaffSelection ?? true;
  const appointmentSlotIntervalMinutes =
    siteSettings?.appointmentSettings?.appointmentSlotIntervalMinutes ?? 30;
  const preferredStaffLabel = appointmentStyle
    ? getAppointmentStaffLabel(templateSlug)
    : "Preferred staff member (optional)";
  const appointmentHeading = getAppointmentActionHeading(templateSlug);
  const flexibleHeading = flexibleJobHeading(templateSlug);
  const flexibleServiceLabel = flexibleJobServiceLabel(templateSlug);
  const flexibleAddressLabel = flexibleJobAddressLabel(templateSlug);
  const frequencyOptions = flexibleJobFrequencyOptions(templateSlug);
  const isDogGrooming = templateSlug === "dog-grooming";
  const taxiJourneyTypes = taxiJourneyTypeOptions();

  const [form, setForm] = useState(() => {
    const profile = getLocalCustomerProfile();
    return {
    customerName: profile.name,
    customerEmail: profile.email,
    customerPhone: profile.phone,
    serviceId: initialServiceId ?? "",
    preferredDate: "",
    preferredTime: "",
    customerAddress: "",
    pickupAddress: "",
    destinationAddress: "",
    preferredStaffId: "",
    frequency: "",
    propertyType: "",
    accessNotes: "",
    preferredVisitWindow: "",
    photoNotes: "",
    vehicleDetails: "",
    journeyType: "",
    returnJourneyRequired: false,
    returnDate: "",
    returnTime: "",
    passengerCount: "",
    luggageCount: "",
    flightNumber: "",
    childSeatNotes: "",
    accessibilityNotes: "",
    corporateAccountReference: "",
    stops: "",
    petName: "",
    petBreed: "",
    dogSize: "",
    temperamentNotes: "",
    notes: "",
    };
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHourKey, setExpandedHourKey] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);


  function selectedServiceName(): string | undefined {
    return effectiveServices.find((service) => service.id === form.serviceId)?.name;
  }

  const selectedServiceSettings = useMemo(() => {
    if (typeof window === "undefined" || !form.serviceId) return null;
    const template = getWebsiteTemplate(templateSlug);
    if (!template) return null;
    const settings = getLocalCustomerSiteSettings(templateSlug, template);
    return settings.services.find((service) => service.id === form.serviceId) ?? null;
  }, [form.serviceId, templateSlug]);

  const dogExtraDetails = useMemo(() => {
    if (!isDogGrooming) return undefined;
    const details = Object.fromEntries(
      Object.entries({
        petName: form.petName,
        breed: form.petBreed,
        dogSize: form.dogSize,
        temperamentNotes: form.temperamentNotes,
      }).filter(([, value]) => value.trim().length > 0),
    );
    return Object.keys(details).length > 0 ? details : undefined;
  }, [isDogGrooming, form.petName, form.petBreed, form.dogSize, form.temperamentNotes]);

  const selectedStaffMember = useMemo(
    () => selectableStaff.find((staff) => staff.id === form.preferredStaffId),
    [form.preferredStaffId, selectableStaff],
  );

  const dayAvailability = useMemo(() => {
    if (!appointmentStyle) return [];
    const staffAvailability = selectedStaffMember?.id
      ? getStaffAvailability(templateSlug, selectedStaffMember.id)
      : [];
    const staffRotaDays = selectedStaffMember?.id
      ? getLocalStaffRotaForStaff(templateSlug, selectedStaffMember.id)
      : [];

    return buildBookingDayAvailability({
      industrySlug: templateSlug,
      daysToReturn: 14,
      businessAvailabilityWindows: businessAvailabilityAll,
      selectedStaffAvailabilityWindows: staffAvailability,
      selectedStaffRotaDays: staffRotaDays,
      businessClosures: listLocalBusinessClosures(templateSlug),
      staffHolidays: listLocalStaffHolidays(templateSlug),
      selectedStaffId: selectedStaffMember?.id,
      selectedStaffName: selectedStaffMember?.displayName,
      existingRequests,
      serviceDurationMinutes:
        (selectedServiceSettings?.durationMinutes ?? 45) +
        (selectedServiceSettings?.bufferAfterMinutes ?? 0),
      slotIntervalMinutes: appointmentSlotIntervalMinutes,
    });
  }, [
    appointmentStyle,
    businessAvailabilityAll,
    existingRequests,
    selectedServiceSettings,
    selectedStaffMember,
    templateSlug,
    appointmentSlotIntervalMinutes,
  ]);

  const preferredSlots = useMemo<AppointmentSlotPreference[]>(() => {
    if (!appointmentStyle || !form.preferredDate) {
      return [];
    }
    return dayAvailability.find((day) => day.date === form.preferredDate)?.slots ?? [];
  }, [appointmentStyle, dayAvailability, form.preferredDate]);

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
        {appointmentStyle
          ? appointmentHeading
          : flexibleJobStyle
            ? flexibleHeading
            : taxiStyle
              ? taxiRequestHeading()
              : "Request service"}
      </h3>
      {appointmentStyle && selectedServiceSettings?.durationMinutes ? (
        <p className="mt-1 text-xs text-slate-600">
          Selected service duration: {selectedServiceSettings.durationMinutes} minutes
          {selectedServiceSettings.bufferAfterMinutes ? ` + ${selectedServiceSettings.bufferAfterMinutes} minute buffer` : ""}
        </p>
      ) : null}
      {appointmentStyle && businessAvailabilityPreview.length > 0 ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Opening hours</p>
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
        <p className="mt-1 text-xs text-slate-600">Opening hours vary by day. Please choose your preferred date and time.</p>
      ) : null}

      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.customerName || (!form.customerEmail && !form.customerPhone)) {
            setError("Name and either email or phone are required.");
            return;
          }
          if (appointmentStyle && (!form.serviceId || !form.preferredDate || !form.preferredTime)) {
            setError("Service, preferred date, and preferred time are required.");
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
          if (flexibleJobStyle && !form.serviceId) {
            setError("Service is required for this request type.");
            return;
          }
          if (flexibleJobStyle && !form.customerAddress) {
            setError("Address/location is required for this request type.");
            return;
          }
          if (flexibleJobStyle && !form.preferredDate && !form.preferredVisitWindow) {
            setError("Add a preferred date or preferred visit window.");
            return;
          }
          if (taxiStyle && (!form.pickupAddress || !form.destinationAddress || !form.preferredDate || !form.preferredTime || !form.journeyType)) {
            setError("Pickup, destination, pickup date/time, and journey type are required.");
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
            extraDetails: dogExtraDetails,
            frequency: flexibleJobStyle ? form.frequency || undefined : undefined,
            propertyType: flexibleJobStyle ? form.propertyType || undefined : undefined,
            accessNotes: flexibleJobStyle ? form.accessNotes || undefined : undefined,
            preferredVisitWindow: flexibleJobStyle ? form.preferredVisitWindow || undefined : undefined,
            photoNotes: flexibleJobStyle ? form.photoNotes || undefined : undefined,
            vehicleDetails: flexibleJobStyle ? form.vehicleDetails || undefined : undefined,
            journeyType: taxiStyle ? form.journeyType || undefined : undefined,
            returnJourneyRequired: taxiStyle ? form.returnJourneyRequired : undefined,
            returnDate: taxiStyle && form.returnJourneyRequired ? form.returnDate || undefined : undefined,
            returnTime: taxiStyle && form.returnJourneyRequired ? form.returnTime || undefined : undefined,
            passengerCount: taxiStyle ? form.passengerCount || undefined : undefined,
            luggageCount: taxiStyle ? form.luggageCount || undefined : undefined,
            flightNumber: taxiStyle ? form.flightNumber || undefined : undefined,
            childSeatNotes: taxiStyle ? form.childSeatNotes || undefined : undefined,
            accessibilityNotes: taxiStyle ? form.accessibilityNotes || undefined : undefined,
            corporateAccountReference: taxiStyle ? form.corporateAccountReference || undefined : undefined,
            stops: taxiStyle ? form.stops || undefined : undefined,
            preferredStaffId: selectedStaffMember?.id,
            preferredStaffName: selectedStaffMember?.displayName,
            communicationChannels: [CustomerRequestCommunicationChannel.EMAIL],
          });
          setSubmitted(true);
          setError(null);
          requestAnimationFrame(() => {
            confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            confirmationRef.current?.focus();
          });
        }}
      >
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer name" value={form.customerName} onChange={(event) => setForm((c) => ({ ...c, customerName: event.target.value }))} />
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer email" value={form.customerEmail} onChange={(event) => setForm((c) => ({ ...c, customerEmail: event.target.value }))} />
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer phone" value={form.customerPhone} onChange={(event) => setForm((c) => ({ ...c, customerPhone: event.target.value }))} />
        {appointmentStyle ? (
          <ServiceTileSelector
            services={effectiveServices}
            selectedServiceId={form.serviceId}
            onSelectService={(serviceId) => setForm((c) => ({ ...c, serviceId, preferredDate: "", preferredTime: "" }))}
          />
        ) : (
          <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.serviceId} onChange={(event) => setForm((c) => ({ ...c, serviceId: event.target.value }))}>
            <option value="">{flexibleJobStyle ? flexibleServiceLabel : "Select service"}</option>
            {effectiveServices.map((service) => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
        )}

        {appointmentStyle ? (
          <div className="sm:col-span-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Choose a day</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {dayAvailability.map((day) => {
                const selected = form.preferredDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={day.blocked}
                    className={`rounded-md border p-2 text-left text-xs ${availabilityClass(day.level, selected)}`}
                    onClick={() => {
                      if (day.blocked) return;
                      setExpandedHourKey(null);
                      setForm((c) => ({ ...c, preferredDate: day.date, preferredTime: "" }));
                    }}
                  >
                    <p className="font-semibold">{weekdayLabel(day.weekday)}</p>
                    <p>{formatUkDate(day.date)}</p>
                    <div className={`mt-1 h-1.5 w-full rounded ${day.level === "HIGH" ? "bg-emerald-500" : day.level === "LIMITED" ? "bg-orange-500" : day.level === "LOW" ? "bg-rose-500" : "bg-slate-300"}`} />
                    <p className="mt-1 text-[11px] font-medium">
                      {day.blocked ? day.blockedLabel : `${day.availableSlotCount} slots`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.preferredDate} onChange={(event) => setForm((c) => ({ ...c, preferredDate: event.target.value }))} />
        )}

        {appointmentStyle ? (
          <div className="sm:col-span-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Choose a time</p>
            {!form.preferredDate ? (
              <p className="mt-1 text-xs text-slate-600">Select a day to view available times.</p>
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
                    {appointmentSlotIntervalMinutes === 15 ? (
                      <div className="mt-1 space-y-2">
                        {Array.from(
                          slotGroups[group.key].reduce((map, slot) => {
                            const hour = `${slot.startTime.slice(0, 2)}:00`;
                            if (!map.has(hour)) map.set(hour, []);
                            map.get(hour)?.push(slot);
                            return map;
                          }, new Map<string, AppointmentSlotPreference[]>()),
                        ).map(([hour, slots]) => {
                          const hourKey = `${group.key}:${hour}`;
                          const selected = expandedHourKey === hourKey;
                          const allBlocked = slots.every((slot) => slot.blocked);
                          return (
                            <div key={hourKey} className="rounded-md border border-slate-200 p-2">
                              <button
                                type="button"
                                disabled={allBlocked}
                                className={`w-full rounded-md border px-2 py-1 text-left text-xs font-semibold ${
                                  selected
                                    ? "border-sky-700 bg-sky-700 text-white"
                                    : allBlocked
                                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                                }`}
                                onClick={() => setExpandedHourKey((current) => (current === hourKey ? null : hourKey))}
                              >
                                {hour}
                              </button>
                              {selected ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {slots.map((slot) => (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      disabled={Boolean(slot.blocked)}
                                      className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                        form.preferredTime === slot.startTime
                                          ? "border-sky-700 bg-sky-700 text-white"
                                          : slot.blocked
                                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                            : "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
                                      }`}
                                      onClick={() => {
                                        if (slot.blocked) return;
                                        setForm((c) => ({ ...c, preferredTime: slot.startTime }));
                                      }}
                                    >
                                      {slot.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {slotGroups[group.key].length === 0 ? (
                          <span className="text-xs text-slate-500">No times available in this period.</span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {slotGroups[group.key].length === 0 ? (
                          <span className="text-xs text-slate-500">No times available in this period.</span>
                        ) : (
                          slotGroups[group.key].map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={Boolean(slot.blocked)}
                              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                form.preferredTime === slot.startTime
                                  ? "border-sky-700 bg-sky-700 text-white"
                                  : slot.blocked
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
                              }`}
                              onClick={() => {
                                if (slot.blocked) return;
                                setForm((c) => ({ ...c, preferredTime: slot.startTime }));
                              }}
                            >
                              {slot.label} {slot.blocked ? "· Unavailable" : ""}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : flexibleJobStyle ? (
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            placeholder="Preferred time window (optional)"
            value={form.preferredVisitWindow}
            onChange={(event) => setForm((c) => ({ ...c, preferredVisitWindow: event.target.value }))}
          />
        ) : (
          <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.preferredTime} onChange={(event) => setForm((c) => ({ ...c, preferredTime: event.target.value }))} />
        )}

        {allowCustomerStaffSelection && selectableStaff.length > 0 ? (
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
            value={form.preferredStaffId}
            onChange={(event) => setForm((c) => ({ ...c, preferredStaffId: event.target.value, preferredDate: "", preferredTime: "" }))}
          >
            <option value="">{preferredStaffLabel}</option>
            {selectableStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.displayName}</option>
            ))}
          </select>
        ) : null}

        {locationType === CustomerRequestLocationType.ROUTE ? (
          <>
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Pickup address" value={form.pickupAddress} onChange={(event) => setForm((c) => ({ ...c, pickupAddress: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Destination address" value={form.destinationAddress} onChange={(event) => setForm((c) => ({ ...c, destinationAddress: event.target.value }))} />
          </>
        ) : null}

        {taxiStyle ? (
          <>
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.journeyType} onChange={(event) => setForm((c) => ({ ...c, journeyType: event.target.value }))}>
              <option value="">Journey type</option>
              {taxiJourneyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700">
              <input type="checkbox" checked={form.returnJourneyRequired} onChange={(event) => setForm((c) => ({ ...c, returnJourneyRequired: event.target.checked }))} />
              Return journey required
            </label>
          </>
        ) : null}

        {locationType === CustomerRequestLocationType.CUSTOMER_ADDRESS ? (
          <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder={flexibleJobStyle ? flexibleAddressLabel : "Service address"} value={form.customerAddress} onChange={(event) => setForm((c) => ({ ...c, customerAddress: event.target.value }))} />
        ) : null}

        {flexibleJobStyle ? (
          <>
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={form.frequency} onChange={(event) => setForm((c) => ({ ...c, frequency: event.target.value }))}>
              <option value="">Frequency (optional)</option>
              {frequencyOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Property type (optional)" value={form.propertyType} onChange={(event) => setForm((c) => ({ ...c, propertyType: event.target.value }))} />
            {templateSlug === "mobile-valeting" ? (
              <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Vehicle details (optional)" value={form.vehicleDetails} onChange={(event) => setForm((c) => ({ ...c, vehicleDetails: event.target.value }))} />
            ) : null}
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Access notes (optional)" value={form.accessNotes} onChange={(event) => setForm((c) => ({ ...c, accessNotes: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Photo notes (optional)" value={form.photoNotes} onChange={(event) => setForm((c) => ({ ...c, photoNotes: event.target.value }))} />
          </>
        ) : null}

        {isDogGrooming ? (
          <>
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Pet name (optional)" value={form.petName} onChange={(event) => setForm((c) => ({ ...c, petName: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Breed (optional)" value={form.petBreed} onChange={(event) => setForm((c) => ({ ...c, petBreed: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Dog size (optional)" value={form.dogSize} onChange={(event) => setForm((c) => ({ ...c, dogSize: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Temperament / handling notes (optional)" value={form.temperamentNotes} onChange={(event) => setForm((c) => ({ ...c, temperamentNotes: event.target.value }))} />
          </>
        ) : null}

        <textarea className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2" placeholder="Notes" value={form.notes} onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))} />
        {error ? <p className="text-xs text-rose-700 sm:col-span-2">{error}</p> : null}
        <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>
          {appointmentStyle ? "Book Appointment" : taxiStyle ? "Save taxi request" : "Save request"}
        </button>
        {submitted ? (
          <div
            ref={confirmationRef}
            tabIndex={-1}
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2"
          >
            Your booking request has been saved. Auto-response prepared.
            <div className="mt-2">
              <Link
                href={`/demo/${templateSlug}/account?tab=bookings`}
                className="font-semibold underline"
              >
                View in customer account
              </Link>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}





