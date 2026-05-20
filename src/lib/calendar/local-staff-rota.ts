import { StaffRotaDay, WEEKDAYS, Weekday } from "@/lib/calendar/calendar-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";

function rotaKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-staff-rota:${industrySlug}`;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parse(raw: string | null): StaffRotaDay[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StaffRotaDay[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const TUESDAY_TO_SATURDAY: Weekday[] = ["tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONDAY_TO_FRIDAY: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function usesTuesdayToSaturday(industrySlug: WebsiteTemplateSlug): boolean {
  return ["barbers", "hairdressers", "beauticians", "nail-salon", "massage", "dog-grooming"].includes(industrySlug);
}

export function listLocalStaffRota(industrySlug: WebsiteTemplateSlug): StaffRotaDay[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(rotaKey(industrySlug)));
}

export function getLocalStaffRotaForStaff(industrySlug: WebsiteTemplateSlug, staffId: string): StaffRotaDay[] {
  return listLocalStaffRota(industrySlug).filter((day) => day.staffId === staffId);
}

export function saveLocalStaffRota(industrySlug: WebsiteTemplateSlug, rotaDays: StaffRotaDay[]): StaffRotaDay[] {
  if (typeof window === "undefined") return rotaDays;
  window.localStorage.setItem(rotaKey(industrySlug), JSON.stringify(rotaDays));
  return rotaDays;
}

export function updateLocalStaffRotaForStaff(
  industrySlug: WebsiteTemplateSlug,
  staffId: string,
  rotaDays: StaffRotaDay[],
): StaffRotaDay[] {
  const others = listLocalStaffRota(industrySlug).filter((day) => day.staffId !== staffId);
  return saveLocalStaffRota(industrySlug, [...others, ...rotaDays]);
}

export function seedLocalStaffRota(industrySlug: WebsiteTemplateSlug, staffMembers: StaffMember[]): StaffRotaDay[] {
  const existing = listLocalStaffRota(industrySlug);
  if (existing.length > 0) return existing;
  if (staffMembers.length === 0) return [];

  const workingDays = usesTuesdayToSaturday(industrySlug) ? TUESDAY_TO_SATURDAY : MONDAY_TO_FRIDAY;

  const seeded = staffMembers.flatMap((staff) =>
    WEEKDAYS.map((weekday) => {
      const working = workingDays.includes(weekday);
      return {
        staffId: staff.id,
        weekday,
        working,
        startTime: working ? "09:00" : undefined,
        endTime: working ? "17:00" : undefined,
        breaks: working
          ? [
              {
                id: generateId("rota_break"),
                staffId: staff.id,
                weekday,
                startTime: "12:30",
                endTime: "13:30",
                label: "Lunch",
                active: true,
              },
            ]
          : [],
      };
    }),
  );

  return saveLocalStaffRota(industrySlug, seeded);
}

export function clearLocalStaffRota(industrySlug: WebsiteTemplateSlug): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(rotaKey(industrySlug));
}
