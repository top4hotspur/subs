import {
  AvailabilityWindowType,
  BusinessAvailabilityWindow,
  StaffAvailabilityWindow,
  Weekday,
} from "@/lib/calendar/calendar-types";
import {
  getDefaultAvailabilityWindowTypeForIndustry,
  shouldUseFlexibleWindowsByDefault,
} from "@/lib/calendar/industry-calendar-defaults";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { listLocalStaff } from "@/lib/staff/local-staff";

function businessKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-business-availability:${industrySlug}`;
}

function staffKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-staff-availability:${industrySlug}`;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseBusiness(raw: string | null): BusinessAvailabilityWindow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BusinessAvailabilityWindow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStaff(raw: string | null): StaffAvailabilityWindow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StaffAvailabilityWindow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const weekdaysMonToSat: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function buildSeedWindows(
  industrySlug: WebsiteTemplateSlug,
  type: AvailabilityWindowType,
): BusinessAvailabilityWindow[] {
  const flexible = shouldUseFlexibleWindowsByDefault(industrySlug);
  return weekdaysMonToSat.map((weekday) => ({
    id: generateId("biz_avail"),
    industrySlug,
    weekday,
    startTime: flexible ? "08:00" : "09:00",
    endTime: flexible ? "18:00" : weekday === "saturday" ? "14:00" : "17:30",
    type,
    notes: flexible ? "Visit window confirmation" : undefined,
    active: true,
  }));
}

export function listLocalBusinessAvailability(
  industrySlug: WebsiteTemplateSlug,
): BusinessAvailabilityWindow[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parseBusiness(window.localStorage.getItem(businessKey(industrySlug)));
}

export function saveLocalBusinessAvailability(
  industrySlug: WebsiteTemplateSlug,
  windows: BusinessAvailabilityWindow[],
): BusinessAvailabilityWindow[] {
  if (typeof window === "undefined") {
    return windows;
  }
  window.localStorage.setItem(businessKey(industrySlug), JSON.stringify(windows));
  return windows;
}

export function seedLocalBusinessAvailability(
  industrySlug: WebsiteTemplateSlug,
): BusinessAvailabilityWindow[] {
  const existing = listLocalBusinessAvailability(industrySlug);
  if (existing.length > 0) {
    return existing;
  }

  const type = getDefaultAvailabilityWindowTypeForIndustry(industrySlug);
  const seeded = buildSeedWindows(industrySlug, type);
  return saveLocalBusinessAvailability(industrySlug, seeded);
}

export function listLocalStaffAvailability(
  industrySlug: WebsiteTemplateSlug,
): StaffAvailabilityWindow[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parseStaff(window.localStorage.getItem(staffKey(industrySlug)));
}

export function saveLocalStaffAvailability(
  industrySlug: WebsiteTemplateSlug,
  windows: StaffAvailabilityWindow[],
): StaffAvailabilityWindow[] {
  if (typeof window === "undefined") {
    return windows;
  }
  window.localStorage.setItem(staffKey(industrySlug), JSON.stringify(windows));
  return windows;
}

export function seedLocalStaffAvailability(
  industrySlug: WebsiteTemplateSlug,
): StaffAvailabilityWindow[] {
  const existing = listLocalStaffAvailability(industrySlug);
  if (existing.length > 0) {
    return existing;
  }

  const business = seedLocalBusinessAvailability(industrySlug);
  const staff = listLocalStaff(industrySlug).filter((member) => member.active);
  if (staff.length === 0) {
    return [];
  }

  const seeded = staff.flatMap((member) =>
    business.map((window) => ({
      id: generateId("staff_avail"),
      staffId: member.id,
      weekday: window.weekday,
      startTime: window.startTime,
      endTime: window.endTime,
      type: window.type,
      notes: "Seeded from business availability",
      active: true,
    })),
  );

  return saveLocalStaffAvailability(industrySlug, seeded);
}

export function getStaffAvailability(
  industrySlug: WebsiteTemplateSlug,
  staffId: string,
): StaffAvailabilityWindow[] {
  return listLocalStaffAvailability(industrySlug).filter((window) => window.staffId === staffId);
}

export function updateStaffAvailability(
  industrySlug: WebsiteTemplateSlug,
  staffId: string,
  windows: StaffAvailabilityWindow[],
): StaffAvailabilityWindow[] {
  const all = listLocalStaffAvailability(industrySlug);
  const withoutCurrent = all.filter((window) => window.staffId !== staffId);
  const merged = [...withoutCurrent, ...windows];
  return saveLocalStaffAvailability(industrySlug, merged);
}

export function clearLocalAvailability(industrySlug: WebsiteTemplateSlug): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(businessKey(industrySlug));
  window.localStorage.removeItem(staffKey(industrySlug));
}

