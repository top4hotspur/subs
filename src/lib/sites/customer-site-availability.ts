import { prisma } from "@/lib/db/prisma";
import {
  BUSINESS_WEEKDAYS,
  normalizeBusinessOpeningHours,
  timeToMinutes,
  type BusinessWeekday,
} from "@/lib/sites/customer-site-opening-hours";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_SLOT_INTERVAL_MINUTES = 15;
const ACTIVE_BOOKING_STATUSES = ["REQUESTED", "SUBMITTED", "CONFIRMED"];

export type CustomerSiteAvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
  staffMemberId: string;
  staffName: string;
  serviceId: string;
  debugReasons?: string[];
};

export type CustomerSiteAvailabilityResult = {
  ok: true;
  siteSlug: string;
  tenantSiteId: string;
  serviceId: string;
  staffId: string | null;
  anyStaff: boolean;
  date: string;
  slots: CustomerSiteAvailabilitySlot[];
  message: string;
  setupIncomplete: boolean;
  debugReasons: string[];
};

type CalculateAvailabilityInput = {
  siteSlug: string;
  serviceId: string;
  staffId?: string | null;
  date: string;
  includeDebug?: boolean;
};

type TimeRange = {
  start: number;
  end: number;
  reason?: string;
};

function isDate(value: string): boolean {
  return DATE_PATTERN.test(value);
}

function isTime(value: string | null | undefined): value is string {
  return Boolean(value && TIME_PATTERN.test(value));
}

function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function weekdayForDate(date: string): BusinessWeekday | null {
  if (!isDate(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
  return BUSINESS_WEEKDAYS[mondayIndex] ?? null;
}

function getUkParts(now = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const date = `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
  const hour = Number(map.get("hour") ?? "0");
  const minute = Number(map.get("minute") ?? "0");
  return { date, minutes: hour * 60 + minute };
}

function overlapsDateRange(date: string, startDate: string | null, endDate: string | null): boolean {
  if (!startDate) return false;
  const end = endDate || startDate;
  return startDate <= date && date <= end;
}

function overlapsTime(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function rangeFromOptionalTimes(allDay: boolean, startTime: string | null, endTime: string | null): TimeRange | null {
  if (allDay) return { start: 0, end: 24 * 60 };
  if (!isTime(startTime) || !isTime(endTime)) return null;
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function rangeWithReason(
  allDay: boolean,
  startTime: string | null,
  endTime: string | null,
  reason: string,
): TimeRange | null {
  const range = rangeFromOptionalTimes(allDay, startTime, endTime);
  return range ? { ...range, reason } : null;
}

function isTimeRange(range: TimeRange | null): range is TimeRange {
  return range !== null;
}

function addUniqueReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export async function calculateCustomerSiteAvailability(
  input: CalculateAvailabilityInput,
): Promise<CustomerSiteAvailabilityResult> {
  const date = input.date.trim();
  const debugReasons: string[] = [];

  if (!isDate(date)) {
    return emptyResult(input, date, "Choose a valid date.", true, ["invalid date"]);
  }

  const site = await prisma.tenantSite.findUnique({
    where: { slug: input.siteSlug.trim().toLowerCase() },
    include: {
      customerSiteSettings: true,
      customerSiteServices: true,
      customerSiteStaffMembers: true,
      customerSiteStaffRotaDays: true,
      customerSiteStaffBreakWindows: true,
      customerSiteBusinessClosures: true,
      customerSiteStaffHolidays: true,
      customerSiteBookings: {
        where: {
          preferredDate: date,
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
      },
    },
  });

  if (!site) {
    return emptyResult(input, date, "Site not found.", true, ["site not found"]);
  }

  const service = site.customerSiteServices.find(
    (item) => item.id === input.serviceId && item.tenantSiteId === site.id,
  );
  if (!service || !service.active) {
    return emptyResultForSite(site.id, site.slug, input, date, "Online booking times will appear here once this business finishes availability setup.", true, ["service inactive or not found"]);
  }

  if (!service.durationMinutes || service.durationMinutes <= 0) {
    return emptyResultForSite(site.id, site.slug, input, date, "Online booking times will appear here once this business finishes availability setup.", true, ["service duration missing"]);
  }

  const weekday = weekdayForDate(date);
  if (!weekday) {
    return emptyResultForSite(site.id, site.slug, input, date, "Choose a valid date.", true, ["invalid weekday"]);
  }

  const openingHours = normalizeBusinessOpeningHours(site.customerSiteSettings?.openingHoursJson ?? null);
  const businessDay = openingHours.days.find((day) => day.weekday === weekday);
  const businessStart = businessDay?.open ? timeToMinutes(businessDay.startTime) : null;
  const businessEnd = businessDay?.open ? timeToMinutes(businessDay.endTime) : null;
  if (!businessDay?.open || businessStart === null || businessEnd === null || businessEnd <= businessStart) {
    return emptyResultForSite(site.id, site.slug, input, date, "No available times found for this date. Please try another date.", false, ["business closed or opening hours missing"]);
  }

  const activeStaff = site.customerSiteStaffMembers.filter((staff) => staff.active && staff.tenantSiteId === site.id);
  if (activeStaff.length === 0) {
    return emptyResultForSite(site.id, site.slug, input, date, "Online booking times will appear here once this business finishes availability setup.", true, ["no active staff"]);
  }

  const requestedStaffId = input.staffId?.trim() || null;
  let candidateStaff = activeStaff;
  if (requestedStaffId) {
    const staff = activeStaff.find((item) => item.id === requestedStaffId);
    if (!staff) {
      return emptyResultForSite(site.id, site.slug, input, date, "Online booking times will appear here once this business finishes availability setup.", true, ["staff inactive or not found"]);
    }
    candidateStaff = [staff];
  }

  const closureRanges = site.customerSiteBusinessClosures
    .filter((closure) => closure.active && overlapsDateRange(date, closure.date, closure.endDate))
    .map((closure) => rangeWithReason(closure.allDay, closure.startTime, closure.endTime, closure.label || "business closed"))
    .filter(isTimeRange);

  if (closureRanges.some((range) => range.start === 0 && range.end === 24 * 60)) {
    return emptyResultForSite(site.id, site.slug, input, date, "No available times found for this date. Please try another date.", false, ["business closure blocks date"]);
  }

  const ukNow = getUkParts();
  const todayMinStart = date === ukNow.date ? Math.ceil(ukNow.minutes / DEFAULT_SLOT_INTERVAL_MINUTES) * DEFAULT_SLOT_INTERVAL_MINUTES : null;
  const serviceDuration = service.durationMinutes;
  const bufferAfter = Math.max(0, service.bufferAfterMinutes ?? 0);
  const blockDuration = serviceDuration + bufferAfter;
  const slots: CustomerSiteAvailabilitySlot[] = [];

  for (const staff of candidateStaff) {
    const rotaDay = site.customerSiteStaffRotaDays.find(
      (day) => day.staffMemberId === staff.id && day.weekday === weekday && day.working,
    );
    const rotaStart = rotaDay ? timeToMinutes(rotaDay.startTime ?? "") : null;
    const rotaEnd = rotaDay ? timeToMinutes(rotaDay.endTime ?? "") : null;
    if (!rotaDay || rotaStart === null || rotaEnd === null || rotaEnd <= rotaStart) {
      addUniqueReason(debugReasons, `${staff.displayName}: no staff rota for date`);
      continue;
    }

    const workingStart = Math.max(businessStart, rotaStart, todayMinStart ?? 0);
    const workingEnd = Math.min(businessEnd, rotaEnd);
    if (workingEnd - workingStart < serviceDuration) {
      addUniqueReason(debugReasons, `${staff.displayName}: working window too short`);
      continue;
    }

    const breakRanges: TimeRange[] = site.customerSiteStaffBreakWindows
      .filter((window) => window.active && window.staffMemberId === staff.id && window.weekday === weekday)
      .reduce<TimeRange[]>((ranges, window) => {
        const start = timeToMinutes(window.startTime);
        const end = timeToMinutes(window.endTime);
        if (start !== null && end !== null && end > start) {
          ranges.push({ start, end, reason: window.label || "staff break" });
        }
        return ranges;
      }, []);
    const leaveRanges: TimeRange[] = site.customerSiteStaffHolidays
      .filter((holiday) => holiday.active && holiday.staffMemberId === staff.id && overlapsDateRange(date, holiday.date, holiday.endDate))
      .map((holiday) => rangeWithReason(holiday.allDay, holiday.startTime, holiday.endTime, holiday.label || "staff leave"))
      .filter(isTimeRange);
    const bookingRanges: TimeRange[] = site.customerSiteBookings
      .filter((booking) => booking.staffMemberId === staff.id && isTime(booking.preferredTime))
      .reduce<TimeRange[]>((ranges, booking) => {
        const start = timeToMinutes(booking.preferredTime ?? "");
        if (start === null) return ranges;
        const bookedService = booking.serviceId
          ? site.customerSiteServices.find((item) => item.id === booking.serviceId)
          : null;
        const bookedDuration = Math.max(1, bookedService?.durationMinutes ?? serviceDuration);
        const bookedBuffer = Math.max(0, bookedService?.bufferAfterMinutes ?? 0);
        ranges.push({ start, end: start + bookedDuration + bookedBuffer, reason: "existing booking" });
        return ranges;
      }, []);
    const blockedRanges: TimeRange[] = [...closureRanges, ...breakRanges, ...leaveRanges, ...bookingRanges];

    for (let start = workingStart; start + serviceDuration <= workingEnd; start += DEFAULT_SLOT_INTERVAL_MINUTES) {
      const appointmentEnd = start + serviceDuration;
      const blockedEnd = start + blockDuration;
      const conflicts = blockedRanges.filter((range) => overlapsTime(start, blockedEnd, range.start, range.end));
      if (conflicts.length > 0) {
        for (const conflict of conflicts) addUniqueReason(debugReasons, `${staff.displayName}: ${conflict.reason ?? "unavailable"}`);
        continue;
      }
      slots.push({
        date,
        startTime: minutesToTime(start),
        endTime: minutesToTime(appointmentEnd),
        staffMemberId: staff.id,
        staffName: staff.displayName,
        serviceId: service.id,
        ...(input.includeDebug ? { debugReasons: [] } : {}),
      });
    }
  }

  slots.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.staffName.localeCompare(b.staffName));

  return {
    ok: true,
    siteSlug: site.slug,
    tenantSiteId: site.id,
    serviceId: service.id,
    staffId: requestedStaffId,
    anyStaff: !requestedStaffId,
    date,
    slots,
    message: slots.length > 0 ? "Available times found." : "No available times found for this date. Please try another date.",
    setupIncomplete: slots.length === 0 && debugReasons.some((reason) => /missing|no active|no staff rota|duration/i.test(reason)),
    debugReasons: input.includeDebug ? debugReasons : [],
  };
}

function emptyResult(
  input: CalculateAvailabilityInput,
  date: string,
  message: string,
  setupIncomplete: boolean,
  debugReasons: string[],
): CustomerSiteAvailabilityResult {
  return {
    ok: true,
    siteSlug: input.siteSlug,
    tenantSiteId: "",
    serviceId: input.serviceId,
    staffId: input.staffId?.trim() || null,
    anyStaff: !input.staffId,
    date,
    slots: [],
    message,
    setupIncomplete,
    debugReasons: input.includeDebug ? debugReasons : [],
  };
}

function emptyResultForSite(
  tenantSiteId: string,
  siteSlug: string,
  input: CalculateAvailabilityInput,
  date: string,
  message: string,
  setupIncomplete: boolean,
  debugReasons: string[],
): CustomerSiteAvailabilityResult {
  return {
    ...emptyResult(input, date, message, setupIncomplete, debugReasons),
    siteSlug,
    tenantSiteId,
  };
}
