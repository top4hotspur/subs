import {
  AvailabilityWindowType,
  BusinessAvailabilityWindow,
  StaffBreakWindow,
  StaffRotaDay,
  StaffAvailabilityWindow,
  Weekday,
} from "@/lib/calendar/calendar-types";
import { BusinessClosureDate, StaffHolidayDate } from "@/lib/calendar/closure-types";
import { isSlotBlockedByExistingRequest } from "@/lib/calendar/local-appointment-conflicts";
import { CustomerRequest } from "@/lib/requests/request-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

export enum DayPeriod {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  EVENING = "EVENING",
}

export type AppointmentSlotPreference = {
  id: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  period: DayPeriod;
  source: "business_availability" | "staff_availability" | "generic";
  staffId?: string;
  staffName?: string;
  availableLike: boolean;
  blocked?: boolean;
  blockedReason?: string;
  conflictRequestId?: string;
  note?: string;
};

type BuildPreferredAppointmentSlotsOptions = {
  selectedDate: string;
  industrySlug: WebsiteTemplateSlug;
  businessAvailabilityWindows: BusinessAvailabilityWindow[];
  selectedStaffAvailabilityWindows?: StaffAvailabilityWindow[];
  selectedStaffRotaDays?: StaffRotaDay[];
  businessClosures?: BusinessClosureDate[];
  staffHolidays?: StaffHolidayDate[];
  existingRequests?: CustomerRequest[];
  serviceDurationMinutes?: number;
  selectedStaffId?: string;
  selectedStaffName?: string;
};

const GENERIC_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:30"];

function weekdayFromDate(date: string): Weekday | null {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const jsDay = d.getDay();
  const map: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return map[jsDay] ?? null;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlapsBreak(startTime: string, endTime: string, breaks: StaffBreakWindow[]): boolean {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  return breaks.some((item) => {
    if (!item.active) return false;
    const bStart = toMinutes(item.startTime);
    const bEnd = toMinutes(item.endTime);
    return start < bEnd && end > bStart;
  });
}

function overlapsWindow(
  startTime: string,
  endTime: string,
  windowStart?: string,
  windowEnd?: string,
): boolean {
  if (!windowStart || !windowEnd) return true;
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const wStart = toMinutes(windowStart);
  const wEnd = toMinutes(windowEnd);
  return start < wEnd && end > wStart;
}

export function getDayPeriodForTime(time: string): DayPeriod {
  const minutes = toMinutes(time);
  if (minutes < 12 * 60) return DayPeriod.MORNING;
  if (minutes < 17 * 60) return DayPeriod.AFTERNOON;
  return DayPeriod.EVENING;
}

export function buildPreferredAppointmentSlots(
  options: BuildPreferredAppointmentSlotsOptions,
): AppointmentSlotPreference[] {
  const {
    selectedDate,
    industrySlug,
    businessAvailabilityWindows,
    selectedStaffAvailabilityWindows = [],
    selectedStaffRotaDays = [],
    businessClosures = [],
    staffHolidays = [],
    existingRequests = [],
    serviceDurationMinutes = 45,
    selectedStaffId,
    selectedStaffName,
  } = options;

  if (!selectedDate) {
    return [];
  }

  const weekday = weekdayFromDate(selectedDate);
  if (!weekday) {
    return [];
  }

  const isBlockedByBusinessClosure = (startTime: string, endTime: string) =>
    businessClosures.some((closure) => {
      if (!closure.active || closure.date !== selectedDate) return false;
      if (closure.allDay) return true;
      return overlapsWindow(startTime, endTime, closure.startTime, closure.endTime);
    });

  const isBlockedByStaffHoliday = (startTime: string, endTime: string) =>
    Boolean(
      selectedStaffId &&
        staffHolidays.some((holiday) => {
          if (!holiday.active || holiday.staffId !== selectedStaffId || holiday.date !== selectedDate) return false;
          if (holiday.allDay) return true;
          return overlapsWindow(startTime, endTime, holiday.startTime, holiday.endTime);
        }),
    );

  const rotaDay = selectedStaffRotaDays.find((day) => day.weekday === weekday);
  const rotaWindows: StaffAvailabilityWindow[] =
    rotaDay && rotaDay.working && rotaDay.startTime && rotaDay.endTime
      ? [
          {
            id: `rota_${selectedStaffId ?? "staff"}_${weekday}`,
            staffId: selectedStaffId ?? "",
            weekday,
            startTime: rotaDay.startTime,
            endTime: rotaDay.endTime,
            type: AvailabilityWindowType.APPOINTMENT_ONLY,
            notes: "Derived from staff rota",
            active: true,
          },
        ]
      : [];

  const sourceWindows =
    rotaWindows.length > 0
      ? rotaWindows
      : selectedStaffAvailabilityWindows.length > 0
        ? selectedStaffAvailabilityWindows.filter((window) => window.active && window.weekday === weekday)
        : businessAvailabilityWindows.filter((window) => window.active && window.weekday === weekday);

  if (sourceWindows.length === 0) {
    return GENERIC_SLOTS.map((time, index) => {
      const endTime = addMinutes(time, serviceDurationMinutes);
      const conflict = isSlotBlockedByExistingRequest({
        industrySlug,
        staffId: selectedStaffId,
        date: selectedDate,
        startTime: time,
        endTime,
        existingRequests,
      });

      const businessClosed = isBlockedByBusinessClosure(time, endTime);
      const staffOnHoliday = isBlockedByStaffHoliday(time, endTime);
      return {
        id: `generic_${selectedDate}_${index}`,
        label: time,
        date: selectedDate,
        startTime: time,
        endTime,
        period: getDayPeriodForTime(time),
        source: "generic" as const,
        staffId: selectedStaffId,
        staffName: selectedStaffName,
        availableLike: false,
        blocked: businessClosed || Boolean(staffOnHoliday) || conflict.blocked,
        blockedReason: businessClosed
          ? "Business closed"
          : staffOnHoliday
            ? "Staff holiday"
            : conflict.blocked
              ? "Already booked"
              : undefined,
        conflictRequestId: conflict.blockingRequest?.id,
        note: "Preferred slot only. Final time is confirmed by the business.",
      };
    });
  }

  const slots: AppointmentSlotPreference[] = [];
  sourceWindows.forEach((window, index) => {
    const start = toMinutes(window.startTime);
    const end = toMinutes(window.endTime);
    const step = 60;

    for (let cursor = start; cursor + serviceDurationMinutes <= end; cursor += step) {
      const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
      const mm = String(cursor % 60).padStart(2, "0");
      const startTime = `${hh}:${mm}`;
      const endTime = addMinutes(startTime, serviceDurationMinutes);

      if (rotaDay?.breaks?.length && overlapsBreak(startTime, endTime, rotaDay.breaks)) {
        continue;
      }

      const conflict = isSlotBlockedByExistingRequest({
        industrySlug,
        staffId: selectedStaffId,
        date: selectedDate,
        startTime,
        endTime,
        existingRequests,
      });

      const businessClosed = isBlockedByBusinessClosure(startTime, endTime);
      const staffOnHoliday = isBlockedByStaffHoliday(startTime, endTime);
      slots.push({
        id: `${window.id}_${index}_${cursor}`,
        label: startTime,
        date: selectedDate,
        startTime,
        endTime,
        period: getDayPeriodForTime(startTime),
        source:
          rotaWindows.length > 0 || selectedStaffAvailabilityWindows.length > 0
            ? "staff_availability"
            : "business_availability",
        staffId: selectedStaffId,
        staffName: selectedStaffName,
        availableLike: true,
        blocked: businessClosed || Boolean(staffOnHoliday) || conflict.blocked,
        blockedReason: businessClosed
          ? "Business closed"
          : staffOnHoliday
            ? "Staff holiday"
            : conflict.blocked
              ? "Already booked"
              : undefined,
        conflictRequestId: conflict.blockingRequest?.id,
        note: "Preferred slot only. Final time is confirmed by the business.",
      });
    }
  });

  return slots.slice(0, 18);
}
