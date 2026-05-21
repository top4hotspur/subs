import { BusinessAvailabilityWindow, StaffRotaDay, Weekday } from "@/lib/calendar/calendar-types";
import { BusinessClosureDate, StaffHolidayDate } from "@/lib/calendar/closure-types";
import { CustomerRequest, CustomerRequestStatus } from "@/lib/requests/request-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";

export type HourlyStaffingBucket = {
  date: string;
  hourLabel: string;
  availableStaffCount: number;
  staffNames: string[];
};

export type DailyStaffingSummary = {
  date: string;
  availableStaffCount: number;
  staffNames: string[];
  closedReason?: string;
};

type ForecastOptions = {
  industrySlug: WebsiteTemplateSlug;
  date: string;
  staffMembers: StaffMember[];
  businessAvailability: BusinessAvailabilityWindow[];
  staffRota: StaffRotaDay[];
  staffHolidays: StaffHolidayDate[];
  businessClosures: BusinessClosureDate[];
};

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function weekdayForDate(date: string): Weekday {
  const jsDay = new Date(`${date}T00:00:00`).getDay();
  return WEEKDAYS[jsDay];
}

function isClosedForDate(date: string, closures: BusinessClosureDate[]): string | null {
  const closure = closures.find((c) => c.active && c.date === date);
  return closure ? closure.label || "Business closed" : null;
}

function isStaffOnHolidayAt(staffId: string, date: string, hourStart: number, hourEnd: number, holidays: StaffHolidayDate[]): boolean {
  return holidays.some((holiday) => {
    if (!holiday.active || holiday.staffId !== staffId || holiday.date !== date) return false;
    if (holiday.allDay) return true;
    if (!holiday.startTime || !holiday.endTime) return false;
    return overlaps(hourStart, hourEnd, toMinutes(holiday.startTime), toMinutes(holiday.endTime));
  });
}

function isStaffWorkingAt(
  staffId: string,
  weekday: Weekday,
  hourStart: number,
  hourEnd: number,
  rota: StaffRotaDay[],
): boolean {
  const day = rota.find((r) => r.staffId === staffId && r.weekday === weekday);
  if (!day || !day.working || !day.startTime || !day.endTime) return false;

  if (!overlaps(hourStart, hourEnd, toMinutes(day.startTime), toMinutes(day.endTime))) {
    return false;
  }

  const onBreak = day.breaks?.some((b) => {
    if (!b.active) return false;
    return overlaps(hourStart, hourEnd, toMinutes(b.startTime), toMinutes(b.endTime));
  });

  return !onBreak;
}

function businessHourRange(date: string, windows: BusinessAvailabilityWindow[]): { startHour: number; endHour: number } {
  const weekday = weekdayForDate(date);
  const dayWindows = windows.filter((w) => w.active && w.weekday === weekday);
  if (dayWindows.length === 0) return { startHour: 9, endHour: 17 };

  const starts = dayWindows.map((w) => toMinutes(w.startTime));
  const ends = dayWindows.map((w) => toMinutes(w.endTime));
  return {
    startHour: Math.floor(Math.min(...starts) / 60),
    endHour: Math.ceil(Math.max(...ends) / 60),
  };
}

export function buildHourlyStaffingForDate(options: ForecastOptions): HourlyStaffingBucket[] {
  const closureReason = isClosedForDate(options.date, options.businessClosures);
  const range = businessHourRange(options.date, options.businessAvailability);
  const weekday = weekdayForDate(options.date);
  const activeStaff = options.staffMembers.filter((s) => s.active);

  const buckets: HourlyStaffingBucket[] = [];
  for (let hour = range.startHour; hour < range.endHour; hour += 1) {
    const start = hour * 60;
    const end = start + 60;
    const names = closureReason
      ? []
      : activeStaff
          .filter((staff) => isStaffWorkingAt(staff.id, weekday, start, end, options.staffRota))
          .filter((staff) => !isStaffOnHolidayAt(staff.id, options.date, start, end, options.staffHolidays))
          .map((staff) => staff.displayName);

    buckets.push({
      date: options.date,
      hourLabel: `${String(hour).padStart(2, "0")}:00`,
      availableStaffCount: names.length,
      staffNames: names,
    });
  }

  return buckets;
}

export function buildDailyStaffingSummary(options: Omit<ForecastOptions, "date"> & { date: string }): DailyStaffingSummary {
  const closureReason = isClosedForDate(options.date, options.businessClosures);
  if (closureReason) {
    return { date: options.date, availableStaffCount: 0, staffNames: [], closedReason: closureReason };
  }

  const buckets = buildHourlyStaffingForDate(options);
  const staffNames = Array.from(new Set(buckets.flatMap((b) => b.staffNames)));
  return {
    date: options.date,
    availableStaffCount: staffNames.length,
    staffNames,
  };
}

export function buildStaffingForecast14Days(options: Omit<ForecastOptions, "date"> & { startDate: string }): DailyStaffingSummary[] {
  const start = new Date(`${options.startDate}T00:00:00`);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    return buildDailyStaffingSummary({ ...options, date });
  });
}

const BLOCKING_STATUSES: CustomerRequestStatus[] = [
  CustomerRequestStatus.SUBMITTED,
  CustomerRequestStatus.REVIEWING,
  CustomerRequestStatus.QUOTED,
  CustomerRequestStatus.ACCEPTED,
  CustomerRequestStatus.PAYMENT_PENDING,
  CustomerRequestStatus.CONFIRMED,
  CustomerRequestStatus.STAFF_ALLOCATED,
  CustomerRequestStatus.IN_PROGRESS,
  CustomerRequestStatus.COMPLETED,
];

export function getRequestCalendarDate(request: CustomerRequest): string {
  if (request.preferredDate) return request.preferredDate;
  return request.createdAtIso.slice(0, 10);
}

export function countBookingsByDay(
  industrySlug: WebsiteTemplateSlug,
  requests: CustomerRequest[],
  startDate: string,
  days = 14,
): Array<{ date: string; count: number }> {
  const start = new Date(`${startDate}T00:00:00`);
  const filtered = requests.filter(
    (r) => r.templateSlug === industrySlug && BLOCKING_STATUSES.includes(r.status),
  );

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const count = filtered.filter((r) => getRequestCalendarDate(r) === date).length;
    return { date, count };
  });
}
