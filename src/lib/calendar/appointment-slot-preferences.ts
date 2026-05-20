import {
  BusinessAvailabilityWindow,
  StaffAvailabilityWindow,
  Weekday,
} from "@/lib/calendar/calendar-types";
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
  note?: string;
};

type BuildPreferredAppointmentSlotsOptions = {
  selectedDate: string;
  industrySlug: WebsiteTemplateSlug;
  businessAvailabilityWindows: BusinessAvailabilityWindow[];
  selectedStaffAvailabilityWindows?: StaffAvailabilityWindow[];
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
    businessAvailabilityWindows,
    selectedStaffAvailabilityWindows = [],
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

  const sourceWindows = selectedStaffAvailabilityWindows.length > 0
    ? selectedStaffAvailabilityWindows.filter((window) => window.active && window.weekday === weekday)
    : businessAvailabilityWindows.filter((window) => window.active && window.weekday === weekday);

  if (sourceWindows.length === 0) {
    return GENERIC_SLOTS.map((time, index) => ({
      id: `generic_${selectedDate}_${index}`,
      label: time,
      date: selectedDate,
      startTime: time,
      endTime: addMinutes(time, serviceDurationMinutes),
      period: getDayPeriodForTime(time),
      source: "generic",
      staffId: selectedStaffId,
      staffName: selectedStaffName,
      availableLike: false,
      note: "Preferred slot only. Final time is confirmed by the business.",
    }));
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
      slots.push({
        id: `${window.id}_${index}_${cursor}`,
        label: startTime,
        date: selectedDate,
        startTime,
        endTime: addMinutes(startTime, serviceDurationMinutes),
        period: getDayPeriodForTime(startTime),
        source: selectedStaffAvailabilityWindows.length > 0 ? "staff_availability" : "business_availability",
        staffId: selectedStaffId,
        staffName: selectedStaffName,
        availableLike: true,
        note: "Preferred slot only. Final time is confirmed by the business.",
      });
    }
  });

  return slots.slice(0, 18);
}
