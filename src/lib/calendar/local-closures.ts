import { BusinessClosureDate, StaffHolidayDate } from "@/lib/calendar/closure-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

function businessKey(slug: WebsiteTemplateSlug): string {
  return `subs-business-closures:${slug}`;
}

function staffKey(slug: WebsiteTemplateSlug): string {
  return `subs-staff-holidays:${slug}`;
}

function parseBusiness(raw: string | null): BusinessClosureDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BusinessClosureDate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStaff(raw: string | null): StaffHolidayDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StaffHolidayDate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function id(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listLocalBusinessClosures(industrySlug: WebsiteTemplateSlug): BusinessClosureDate[] {
  if (typeof window === "undefined") return [];
  return parseBusiness(window.localStorage.getItem(businessKey(industrySlug)));
}

export function saveLocalBusinessClosures(
  industrySlug: WebsiteTemplateSlug,
  closures: BusinessClosureDate[],
): BusinessClosureDate[] {
  if (typeof window === "undefined") return closures;
  window.localStorage.setItem(businessKey(industrySlug), JSON.stringify(closures));
  return closures;
}

export function listLocalStaffHolidays(industrySlug: WebsiteTemplateSlug): StaffHolidayDate[] {
  if (typeof window === "undefined") return [];
  return parseStaff(window.localStorage.getItem(staffKey(industrySlug)));
}

export function saveLocalStaffHolidays(
  industrySlug: WebsiteTemplateSlug,
  holidays: StaffHolidayDate[],
): StaffHolidayDate[] {
  if (typeof window === "undefined") return holidays;
  window.localStorage.setItem(staffKey(industrySlug), JSON.stringify(holidays));
  return holidays;
}

export function seedLocalClosures(industrySlug: WebsiteTemplateSlug): {
  businessClosures: BusinessClosureDate[];
  staffHolidays: StaffHolidayDate[];
} {
  const existingBusiness = listLocalBusinessClosures(industrySlug);
  const existingStaff = listLocalStaffHolidays(industrySlug);
  if (existingBusiness.length > 0 || existingStaff.length > 0) {
    return {
      businessClosures: existingBusiness,
      staffHolidays: existingStaff,
    };
  }

  const now = new Date().toISOString();
  const businessClosures: BusinessClosureDate[] = [
    {
      id: id("biz_close"),
      industrySlug,
      date: "2026-12-25",
      label: "Christmas Day",
      allDay: true,
      active: true,
      createdAtIso: now,
      updatedAtIso: now,
    },
  ];

  saveLocalBusinessClosures(industrySlug, businessClosures);
  saveLocalStaffHolidays(industrySlug, []);

  return { businessClosures, staffHolidays: [] };
}

export function clearLocalClosures(industrySlug: WebsiteTemplateSlug): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(businessKey(industrySlug));
  window.localStorage.removeItem(staffKey(industrySlug));
}
