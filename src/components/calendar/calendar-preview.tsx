"use client";

import { useMemo, useState } from "react";
import {
  getDefaultSchedulingNoteForIndustry,
  shouldUseFixedSlotsByDefault,
  shouldUseFlexibleWindowsByDefault,
} from "@/lib/calendar/industry-calendar-defaults";
import {
  listLocalBusinessAvailability,
  listLocalStaffAvailability,
} from "@/lib/calendar/local-availability";
import { listLocalBusinessClosures, listLocalStaffHolidays } from "@/lib/calendar/local-closures";
import { listLocalStaffRota } from "@/lib/calendar/local-staff-rota";
import {
  buildHourlyStaffingForDate,
  buildStaffingForecast14Days,
  countBookingsByDay,
} from "@/lib/calendar/staffing-forecast";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  availabilityWindowTypeLabel,
  customerRequestKindLabel,
  formatOptional,
  formatUkDate,
  weekdayLabel,
} from "@/lib/ui/display-labels";

type CalendarPreviewProps = {
  industrySlug: WebsiteTemplateSlug;
  staffMembers: StaffMember[];
  services: SiteServiceItem[];
};

function schedulingStyleLabel(slug: WebsiteTemplateSlug): string {
  if (slug === "taxi") return "Route-based journey allocation";
  if (shouldUseFlexibleWindowsByDefault(slug)) return "Flexible visit windows";
  if (shouldUseFixedSlotsByDefault(slug)) return "Fixed appointment slots";
  return "General scheduling";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CalendarPreview({ industrySlug, staffMembers, services }: CalendarPreviewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [showLongTermView, setShowLongTermView] = useState(false);
  const [forecastOffset, setForecastOffset] = useState(0);

  const businessWindows = useMemo(
    () => listLocalBusinessAvailability(industrySlug).filter((window) => window.active),
    [industrySlug],
  );
  const staffWindows = useMemo(
    () => listLocalStaffAvailability(industrySlug).filter((window) => window.active),
    [industrySlug],
  );
  const staffRota = useMemo(() => listLocalStaffRota(industrySlug), [industrySlug]);
  const businessClosures = useMemo(() => listLocalBusinessClosures(industrySlug), [industrySlug]);
  const staffHolidays = useMemo(() => listLocalStaffHolidays(industrySlug), [industrySlug]);

  const requestItems = useMemo(
    () =>
      listLocalCustomerRequests()
        .filter((request) => request.templateSlug === industrySlug)
        .slice(0, 50),
    [industrySlug],
  );

  const hourlyBuckets = useMemo(
    () =>
      buildHourlyStaffingForDate({
        industrySlug,
        date: selectedDate,
        staffMembers,
        businessAvailability: businessWindows,
        staffRota,
        staffHolidays,
        businessClosures,
      }),
    [industrySlug, selectedDate, staffMembers, businessWindows, staffRota, staffHolidays, businessClosures],
  );

  const forecast14 = useMemo(
    () =>
      buildStaffingForecast14Days({
        industrySlug,
        startDate: selectedDate,
        staffMembers,
        businessAvailability: businessWindows,
        staffRota,
        staffHolidays,
        businessClosures,
      }),
    [industrySlug, selectedDate, staffMembers, businessWindows, staffRota, staffHolidays, businessClosures],
  );

  const longTermDaily = useMemo(() => {
    const base = new Date(`${selectedDate}T00:00:00`);
    const shifted = new Date(base);
    shifted.setDate(base.getDate() + forecastOffset);
    const startDate = shifted.toISOString().slice(0, 10);
    return buildStaffingForecast14Days({
      industrySlug,
      startDate,
      staffMembers,
      businessAvailability: businessWindows,
      staffRota,
      staffHolidays,
      businessClosures,
    });
  }, [industrySlug, selectedDate, forecastOffset, staffMembers, businessWindows, staffRota, staffHolidays, businessClosures]);

  const bookings14 = useMemo(
    () => countBookingsByDay(industrySlug, requestItems, selectedDate, 14),
    [industrySlug, requestItems, selectedDate],
  );

  const maxHourly = Math.max(1, ...hourlyBuckets.map((item) => item.availableStaffCount));
  const maxDaily = Math.max(1, ...forecast14.map((item) => item.availableStaffCount));
  const maxBookings = Math.max(1, ...bookings14.map((item) => item.count));

  const activeServices = services.filter((service) => service.active);
  const activeStaff = staffMembers.filter((staff) => staff.active);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Calendar preview (mock)</h3>
          <p className="mt-1 text-xs text-slate-600">{schedulingStyleLabel(industrySlug)}. {getDefaultSchedulingNoteForIndustry(industrySlug)}</p>
        </div>
        <label className="text-xs text-slate-700">
          Selected date
          <input type="date" className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Business windows</h4>
          {businessWindows.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active business windows yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {businessWindows.slice(0, 6).map((window) => (
                <li key={window.id}>
                  {weekdayLabel(window.weekday)}: {window.startTime}-{window.endTime} ({availabilityWindowTypeLabel(window.type)})
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Staff coverage</h4>
          {activeStaff.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active staff configured.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {activeStaff.map((staff) => {
                const count = staffWindows.filter((window) => window.staffId === staff.id).length;
                return <li key={staff.id}>{staff.displayName}: {count} active windows</li>;
              })}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Service durations</h4>
          {activeServices.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active services configured.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {activeServices.slice(0, 6).map((service) => (
                <li key={service.id}>
                  {service.name}: {service.durationMinutes ? `${service.durationMinutes} min` : "duration TBC"}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Hourly staffing levels ({formatUkDate(selectedDate)})</h4>
          <div className="mt-2 space-y-2 max-h-80 overflow-auto pr-1">
            {hourlyBuckets.map((item) => (
              <div key={item.hourLabel}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-700">
                  <span>{item.hourLabel}</span>
                  <span>{item.availableStaffCount}</span>
                </div>
                <div className="h-2 rounded bg-slate-200">
                  <div className="h-2 rounded bg-sky-600" style={{ width: `${Math.round((item.availableStaffCount / maxHourly) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Bookings (14-day view)</h4>
          <div className="mt-2 space-y-2 max-h-80 overflow-auto pr-1">
            {bookings14.map((item) => (
              <div key={item.date}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-700">
                  <span>{formatUkDate(item.date)}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded bg-slate-200">
                  <div className="h-2 rounded bg-emerald-600" style={{ width: `${Math.round((item.count / maxBookings) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900">14-day staffing forecast</h4>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setShowLongTermView((v) => !v)}
          >
            {showLongTermView ? "Hide calendar view" : "Open calendar view"}
          </button>
        </div>
        <div className="mt-2 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {forecast14.map((day) => (
              <div key={day.date} className="w-32 rounded-md border border-slate-200 bg-white p-2 text-xs">
                <p className="font-semibold text-slate-900">{formatUkDate(day.date)}</p>
                <p className="mt-1 text-slate-700">Staff: {day.availableStaffCount}</p>
                <div className="mt-1 h-1.5 rounded bg-slate-200">
                  <div className="h-1.5 rounded bg-indigo-600" style={{ width: `${Math.round((day.availableStaffCount / maxDaily) * 100)}%` }} />
                </div>
                {day.closedReason ? <p className="mt-1 text-[11px] text-rose-700">{day.closedReason}</p> : null}
              </div>
            ))}
          </div>
        </div>

        {showLongTermView ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setForecastOffset((v) => v - 14)}
              >
                Previous 14 days
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setForecastOffset((v) => v + 14)}
              >
                Next 14 days
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
              {longTermDaily.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className="rounded-md border border-slate-200 bg-slate-50 p-2 text-left text-xs hover:bg-slate-100"
                  onClick={() => setSelectedDate(day.date)}
                >
                  <p className="font-semibold text-slate-900">{formatUkDate(day.date)}</p>
                  <p className="mt-1 text-slate-700">Available staff: {day.availableStaffCount}</p>
                  {day.closedReason ? <p className="mt-1 text-rose-700">{day.closedReason}</p> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">Example upcoming items</h4>
        {requestItems.length === 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>Mon 09:30 - Example request intake</li>
            <li>Tue 11:00 - Staff allocation review</li>
            <li>Wed 14:00 - Customer confirmation follow-up</li>
          </ul>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {requestItems.slice(0, 8).map((item) => (
              <li key={item.id}>
                {item.preferredDate ? formatUkDate(item.preferredDate) : "Date TBC"} {item.preferredTime || "Time TBC"} - {item.customerName} ({formatOptional(item.serviceName, customerRequestKindLabel(item.kind))})
                {item.assignedStaffName ? ` with ${item.assignedStaffName}` : ""}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
