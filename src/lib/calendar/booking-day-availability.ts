import {
  AppointmentSlotPreference,
  buildPreferredAppointmentSlots,
} from "@/lib/calendar/appointment-slot-preferences";
import {
  BusinessAvailabilityWindow,
  StaffAvailabilityWindow,
  StaffRotaDay,
  Weekday,
} from "@/lib/calendar/calendar-types";
import { BusinessClosureDate, StaffHolidayDate } from "@/lib/calendar/closure-types";
import { CustomerRequest } from "@/lib/requests/request-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type BookingDayAvailabilityLevel = "HIGH" | "LIMITED" | "LOW" | "NONE";

export type BookingDayAvailability = {
  date: string;
  weekday: Weekday;
  availableSlotCount: number;
  totalSlotCount: number;
  level: BookingDayAvailabilityLevel;
  blocked: boolean;
  blockedLabel?: string;
  slots: AppointmentSlotPreference[];
};

type BuildBookingDayAvailabilityOptions = {
  industrySlug: WebsiteTemplateSlug;
  daysToReturn?: number;
  lookAheadDays?: number;
  serviceDurationMinutes?: number;
  slotIntervalMinutes?: 15 | 30 | 60;
  selectedStaffId?: string;
  selectedStaffName?: string;
  businessAvailabilityWindows: BusinessAvailabilityWindow[];
  selectedStaffAvailabilityWindows?: StaffAvailabilityWindow[];
  selectedStaffRotaDays?: StaffRotaDay[];
  businessClosures?: BusinessClosureDate[];
  staffHolidays?: StaffHolidayDate[];
  existingRequests?: CustomerRequest[];
};

const WEEKDAY_MAP: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const TUESDAY_TO_SATURDAY_INDUSTRIES = new Set([
  "barbers",
  "hairdressers",
  "beauticians",
  "nail-salon",
  "massage",
  "dog-grooming",
]);

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function weekdayFromDate(value: Date): Weekday {
  return WEEKDAY_MAP[value.getDay()] ?? "monday";
}

function isBusinessClosedAllDay(
  date: string,
  closures: BusinessClosureDate[],
): boolean {
  return closures.some((closure) => closure.active && closure.date === date && closure.allDay);
}

function fallbackOpenWeekday(industrySlug: WebsiteTemplateSlug, weekday: Weekday): boolean {
  if (TUESDAY_TO_SATURDAY_INDUSTRIES.has(industrySlug)) {
    return ["tuesday", "wednesday", "thursday", "friday", "saturday"].includes(weekday);
  }
  return ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(weekday);
}

function hasOpenWindowForWeekday(
  industrySlug: WebsiteTemplateSlug,
  weekday: Weekday,
  windows: BusinessAvailabilityWindow[],
): boolean {
  if (windows.length === 0) {
    return fallbackOpenWeekday(industrySlug, weekday);
  }
  return windows.some((window) => window.active && window.weekday === weekday);
}

function levelFromCount(count: number): BookingDayAvailabilityLevel {
  if (count <= 0) return "NONE";
  if (count < 5) return "LOW";
  if (count < 10) return "LIMITED";
  return "HIGH";
}

export function buildBookingDayAvailability(
  options: BuildBookingDayAvailabilityOptions,
): BookingDayAvailability[] {
  const {
    industrySlug,
    daysToReturn = 14,
    lookAheadDays = 60,
    serviceDurationMinutes = 45,
    slotIntervalMinutes = 30,
    selectedStaffId,
    selectedStaffName,
    businessAvailabilityWindows,
    selectedStaffAvailabilityWindows = [],
    selectedStaffRotaDays = [],
    businessClosures = [],
    staffHolidays = [],
    existingRequests = [],
  } = options;

  const results: BookingDayAvailability[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < lookAheadDays && results.length < daysToReturn; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const date = toIsoDate(day);
    const weekday = weekdayFromDate(day);
    const closedAllDay = isBusinessClosedAllDay(date, businessClosures);
    const openByWindow = hasOpenWindowForWeekday(industrySlug, weekday, businessAvailabilityWindows);
    if (closedAllDay || !openByWindow) continue;

    const slots = buildPreferredAppointmentSlots({
      selectedDate: date,
      industrySlug,
      businessAvailabilityWindows,
      selectedStaffAvailabilityWindows,
      selectedStaffRotaDays,
      businessClosures,
      staffHolidays,
      existingRequests,
      serviceDurationMinutes,
      slotIntervalMinutes,
      selectedStaffId,
      selectedStaffName,
    });

    const availableSlotCount = slots.filter((slot) => !slot.blocked).length;
    const totalSlotCount = slots.length;
    const level = levelFromCount(availableSlotCount);

    results.push({
      date,
      weekday,
      availableSlotCount,
      totalSlotCount,
      level,
      blocked: availableSlotCount === 0,
      blockedLabel: availableSlotCount === 0 ? "Fully booked" : undefined,
      slots,
    });
  }

  return results;
}

