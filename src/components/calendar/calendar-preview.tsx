"use client";

import { useMemo, useState } from "react";
import {
  getDefaultSchedulingNoteForIndustry,
  shouldUseFixedSlotsByDefault,
  shouldUseFlexibleWindowsByDefault,
} from "@/lib/calendar/industry-calendar-defaults";
import { listLocalBusinessAvailability } from "@/lib/calendar/local-availability";
import {
  listLocalBusinessClosures,
  listLocalStaffHolidays,
} from "@/lib/calendar/local-closures";
import { listLocalStaffRota } from "@/lib/calendar/local-staff-rota";
import {
  buildHourlyStaffingForDate,
  buildStaffingForecast14Days,
  countBookingsByDay,
  getRequestCalendarDate,
} from "@/lib/calendar/staffing-forecast";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  customerRequestKindLabel,
  customerRequestStatusLabel,
  formatOptional,
  formatUkDate,
} from "@/lib/ui/display-labels";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

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

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type DailyTile = {
  date: string;
  availableStaffCount: number;
  closedReason?: string;
};

function build30DayTiles(
  industrySlug: WebsiteTemplateSlug,
  startDate: string,
  staffMembers: StaffMember[],
  businessAvailability: ReturnType<typeof listLocalBusinessAvailability>,
  staffRota: ReturnType<typeof listLocalStaffRota>,
  staffHolidays: ReturnType<typeof listLocalStaffHolidays>,
  businessClosures: ReturnType<typeof listLocalBusinessClosures>,
): DailyTile[] {
  return buildStaffingForecast14Days({
    industrySlug,
    startDate,
    staffMembers,
    businessAvailability,
    staffRota,
    staffHolidays,
    businessClosures,
  })
    .concat(
      buildStaffingForecast14Days({
        industrySlug,
        startDate: shiftDate(startDate, 14),
        staffMembers,
        businessAvailability,
        staffRota,
        staffHolidays,
        businessClosures,
      }),
      buildStaffingForecast14Days({
        industrySlug,
        startDate: shiftDate(startDate, 28),
        staffMembers,
        businessAvailability,
        staffRota,
        staffHolidays,
        businessClosures,
      }),
    )
    .slice(0, 30)
    .map((day) => ({
      date: day.date,
      availableStaffCount: day.availableStaffCount,
      closedReason: day.closedReason,
    }));
}

export function CalendarPreview({ industrySlug, staffMembers }: CalendarPreviewProps) {
  const [windowStartDate, setWindowStartDate] = useState<string>(todayIso());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [inspectDate, setInspectDate] = useState<string>(todayIso());
  const [showThirtyDay, setShowThirtyDay] = useState(false);

  const businessWindows = useMemo(
    () => listLocalBusinessAvailability(industrySlug).filter((window) => window.active),
    [industrySlug],
  );
  const staffRota = useMemo(() => listLocalStaffRota(industrySlug), [industrySlug]);
  const businessClosures = useMemo(
    () => listLocalBusinessClosures(industrySlug),
    [industrySlug],
  );
  const staffHolidays = useMemo(
    () => listLocalStaffHolidays(industrySlug),
    [industrySlug],
  );

  const industryRequests = useMemo(
    () =>
      listLocalCustomerRequests().filter(
        (request) => request.templateSlug === industrySlug,
      ),
    [industrySlug],
  );

  const staffing30 = useMemo(
    () =>
      build30DayTiles(
        industrySlug,
        windowStartDate,
        staffMembers,
        businessWindows,
        staffRota,
        staffHolidays,
        businessClosures,
      ),
    [
      industrySlug,
      windowStartDate,
      staffMembers,
      businessWindows,
      staffRota,
      staffHolidays,
      businessClosures,
    ],
  );

  const staffing7 = staffing30.slice(0, 7);
  const bookings30 = useMemo(
    () => countBookingsByDay(industrySlug, industryRequests, windowStartDate, 30),
    [industrySlug, industryRequests, windowStartDate],
  );
  const bookings7 = bookings30.slice(0, 7);

  const detailRequests = useMemo(
    () =>
      industryRequests
        .filter((request) => getRequestCalendarDate(request) === selectedDate)
        .sort((a, b) =>
          (a.preferredTime || "99:99").localeCompare(b.preferredTime || "99:99"),
        ),
    [industryRequests, selectedDate],
  );

  const hourlyStaffing = useMemo(
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
    [
      industrySlug,
      selectedDate,
      staffMembers,
      businessWindows,
      staffRota,
      staffHolidays,
      businessClosures,
    ],
  );

  const detailDaily =
    staffing30.find((day) => day.date === selectedDate) ?? {
      date: selectedDate,
      availableStaffCount: Array.from(
        new Set(hourlyStaffing.flatMap((bucket) => bucket.staffNames)),
      ).length,
    };

  const detailBookingsCount = detailRequests.filter(
    (request) =>
      request.status !== CustomerRequestStatus.CANCELLED &&
      request.status !== CustomerRequestStatus.NO_SHOW,
  ).length;

  const bookingsByHour = useMemo(() => {
    const map = new Map<string, number>();
    for (const request of detailRequests) {
      const key = request.preferredTime ? `${request.preferredTime.slice(0, 2)}:00` : "TBC";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const fromStaffHours = hourlyStaffing.map((bucket) => ({
      hourLabel: bucket.hourLabel,
      count: map.get(bucket.hourLabel) ?? 0,
    }));
    if (fromStaffHours.length === 0 && map.size > 0) {
      return Array.from(map.entries())
        .map(([hourLabel, count]) => ({ hourLabel, count }))
        .sort((a, b) => a.hourLabel.localeCompare(b.hourLabel));
    }
    return fromStaffHours;
  }, [detailRequests, hourlyStaffing]);

  const maxStaff = Math.max(1, ...staffing7.map((day) => day.availableStaffCount));
  const maxBookings = Math.max(1, ...bookings7.map((day) => day.count));
  const maxHourlyStaff = Math.max(
    1,
    ...hourlyStaffing.map((bucket) => bucket.availableStaffCount),
  );
  const maxHourlyBookings = Math.max(1, ...bookingsByHour.map((bucket) => bucket.count));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Calendar preview (mock)</h3>
          <p className="mt-1 text-xs text-slate-600">
            {schedulingStyleLabel(industrySlug)}. {getDefaultSchedulingNoteForIndustry(industrySlug)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={() => setWindowStartDate(shiftDate(windowStartDate, -7))}
          >
            Previous 7 days
          </button>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={() => setWindowStartDate(shiftDate(windowStartDate, 7))}
          >
            Next 7 days
          </button>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={() => {
              const today = todayIso();
              setWindowStartDate(today);
              setSelectedDate(today);
              setInspectDate(today);
            }}
          >
            Today
          </button>
          <button
            type="button"
            className={`${showThirtyDay ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
            onClick={() => setShowThirtyDay((current) => !current)}
          >
            {showThirtyDay ? "Hide 30-day view" : "Show 30-day view"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="text-xs text-slate-700">
          Inspect date
          <input
            type="date"
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={inspectDate}
            onChange={(event) => setInspectDate(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="ml-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100"
          onClick={() => setSelectedDate(inspectDate)}
        >
          Show details
        </button>
        <p className="mt-2 text-xs text-slate-600">
          Default view is a rolling 7-day window from {formatUkDate(windowStartDate)}. Use inspect date for any out-of-window day.
        </p>
      </div>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-900">7-day staffing levels</h4>
        <div className="mt-3 space-y-2">
          {staffing7.map((day) => (
            <div key={`staff_${day.date}`} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-xs text-slate-700">
              <span>{formatUkDate(day.date)}</span>
              <div className="h-2 rounded bg-slate-200">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{ width: `${Math.max(6, (day.availableStaffCount / maxStaff) * 100)}%` }}
                />
              </div>
              <span className="font-semibold">{day.availableStaffCount}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-900">7-day bookings/requests</h4>
        <div className="mt-3 space-y-2">
          {bookings7.map((day) => (
            <div key={`booking_${day.date}`} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-xs text-slate-700">
              <span>{formatUkDate(day.date)}</span>
              <div className="h-2 rounded bg-slate-200">
                <div
                  className="h-2 rounded bg-sky-500"
                  style={{ width: `${Math.max(6, (day.count / maxBookings) * 100)}%` }}
                />
              </div>
              <span className="font-semibold">{day.count}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">7-day quick select</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {staffing7.map((day, index) => {
            const dayBookings = bookings7[index]?.count ?? 0;
            const isSelected = day.date === selectedDate;
            return (
              <button
                key={`day7_${day.date}`}
                type="button"
                className={`rounded-md border p-2 text-left text-xs ${
                  isSelected
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                onClick={() => {
                  setSelectedDate(day.date);
                  setInspectDate(day.date);
                }}
              >
                <p className="font-semibold text-slate-900">{formatUkDate(day.date)}</p>
                <p className="mt-1 text-slate-700">Staff: {day.availableStaffCount}</p>
                <p className="text-slate-700">Bookings: {dayBookings}</p>
                {day.closedReason ? <p className="mt-1 text-rose-700">{day.closedReason}</p> : null}
              </button>
            );
          })}
        </div>
      </article>

      {showThirtyDay ? (
        <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">30-day view</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {staffing30.map((day) => {
              const dayBookings = bookings30.find((b) => b.date === day.date)?.count ?? 0;
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={`day30_${day.date}`}
                  type="button"
                  className={`rounded-md border p-2 text-left text-xs ${
                    isSelected
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setInspectDate(day.date);
                  }}
                >
                  <p className="font-semibold text-slate-900">{formatUkDate(day.date)}</p>
                  <p className="mt-1 text-slate-700">Staff: {day.availableStaffCount}</p>
                  <p className="text-slate-700">Bookings: {dayBookings}</p>
                  {day.closedReason ? <p className="mt-1 text-rose-700">{day.closedReason}</p> : null}
                </button>
              );
            })}
          </div>
        </article>
      ) : null}

      <article className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">Details for {formatUkDate(selectedDate)}</h4>
        <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <span className="font-semibold">Staff available:</span> {detailDaily.availableStaffCount}
          </p>
          <p>
            <span className="font-semibold">Bookings/requests:</span> {detailBookingsCount}
          </p>
        </div>
        {detailDaily.closedReason ? (
          <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            Business closure: {detailDaily.closedReason}
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Staff level by hour</p>
            <div className="mt-2 space-y-1">
              {hourlyStaffing.map((bucket) => (
                <div key={`hour_staff_${bucket.hourLabel}`} className="grid grid-cols-[50px_1fr_auto] items-center gap-2 text-xs text-slate-700">
                  <span>{bucket.hourLabel}</span>
                  <div className="h-2 rounded bg-slate-200">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{ width: `${Math.max(6, (bucket.availableStaffCount / maxHourlyStaff) * 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold">{bucket.availableStaffCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Appointments/bookings by hour</p>
            <div className="mt-2 space-y-1">
              {bookingsByHour.map((bucket) => (
                <div key={`hour_booking_${bucket.hourLabel}`} className="grid grid-cols-[50px_1fr_auto] items-center gap-2 text-xs text-slate-700">
                  <span>{bucket.hourLabel}</span>
                  <div className="h-2 rounded bg-slate-200">
                    <div
                      className="h-2 rounded bg-sky-500"
                      style={{ width: `${Math.max(6, (bucket.count / maxHourlyBookings) * 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold">{bucket.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {detailRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No local bookings or requests for this day.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {detailRequests.map((request) => (
              <li key={request.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  {request.preferredTime || "Time TBC"} - {request.customerName}
                </p>
                <p className="mt-1">{formatOptional(request.serviceName, customerRequestKindLabel(request.kind))}</p>
                <p className="mt-1">Status: {customerRequestStatusLabel(request.status)}</p>
                <p className="mt-1">Assigned staff: {formatOptional(request.assignedStaffName, "Unassigned")}</p>
                <p className="mt-1">Preferred staff: {formatOptional(request.preferredStaffName, "No preference")}</p>
                {request.notes ? <p className="mt-1 text-slate-600">Notes: {request.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      <p className="mt-4 text-xs text-slate-500">
        Booking counts include submitted/active workflow items and exclude cancelled/no-show items. This is local mock inspection only with no real calendar sync or server-side locking.
      </p>
    </section>
  );
}
