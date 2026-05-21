import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  getDefaultStaffAvailabilityModeForIndustry,
  getDefaultStaffLabelForIndustry,
  getDefaultStaffRoleForIndustry,
  shouldCustomersSelectStaffByDefault,
} from "@/lib/staff/industry-staff-defaults";
import { StaffMember } from "@/lib/staff/staff-types";

function staffKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-staff:${industrySlug}`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parse(raw: string | null): StaffMember[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as StaffMember[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listLocalStaff(industrySlug: WebsiteTemplateSlug): StaffMember[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parse(window.localStorage.getItem(staffKey(industrySlug)));
}

export function getLocalStaffMember(industrySlug: WebsiteTemplateSlug, staffId: string): StaffMember | null {
  return listLocalStaff(industrySlug).find((staff) => staff.id === staffId) ?? null;
}

export function saveLocalStaff(industrySlug: WebsiteTemplateSlug, staff: StaffMember[]): StaffMember[] {
  if (typeof window === "undefined") {
    return staff;
  }
  window.localStorage.setItem(staffKey(industrySlug), JSON.stringify(staff));
  return staff;
}

type CreateStaffInput = Omit<StaffMember, "id" | "createdAtIso" | "updatedAtIso">;

export function createLocalStaffMember(industrySlug: WebsiteTemplateSlug, input: CreateStaffInput): StaffMember {
  const now = new Date().toISOString();
  const staffMember: StaffMember = {
    ...input,
    id: generateId(),
    createdAtIso: now,
    updatedAtIso: now,
  };
  const all = listLocalStaff(industrySlug);
  all.push(staffMember);
  saveLocalStaff(industrySlug, all);
  return staffMember;
}

export function updateLocalStaffMember(
  industrySlug: WebsiteTemplateSlug,
  staffId: string,
  patch: Partial<Omit<StaffMember, "id" | "createdAtIso">>,
): StaffMember | null {
  const now = new Date().toISOString();
  const next = listLocalStaff(industrySlug).map((staff) =>
    staff.id === staffId ? { ...staff, ...patch, updatedAtIso: now } : staff,
  );
  saveLocalStaff(industrySlug, next);
  return next.find((staff) => staff.id === staffId) ?? null;
}

export function deactivateLocalStaffMember(industrySlug: WebsiteTemplateSlug, staffId: string): StaffMember | null {
  return updateLocalStaffMember(industrySlug, staffId, { active: false });
}

export function deleteLocalStaffMember(industrySlug: WebsiteTemplateSlug, staffId: string): void {
  const next = listLocalStaff(industrySlug).filter((staff) => staff.id !== staffId);
  saveLocalStaff(industrySlug, next);
}

export function seedLocalStaff(industrySlug: WebsiteTemplateSlug, services?: { id: string }[]): StaffMember[] {
  const existing = listLocalStaff(industrySlug);
  if (existing.length > 0) {
    return existing;
  }

  const role = getDefaultStaffRoleForIndustry(industrySlug);
  const availabilityMode = getDefaultStaffAvailabilityModeForIndustry(industrySlug);
  const customerSelectable = shouldCustomersSelectStaffByDefault(industrySlug);
  const label = getDefaultStaffLabelForIndustry(industrySlug);
  const serviceIds = (services ?? []).slice(0, 3).map((service) => service.id);
  const now = new Date().toISOString();

  const seeded: StaffMember[] = [1, 2, 3].map((n) => ({
    id: generateId(),
    displayName: `${label} ${n}`,
    role,
    roleLabel: `${label} ${n}`,
    email: undefined,
    phone: undefined,
    bio: `${label} ${n} profile placeholder.`,
    serviceIds,
    active: true,
    customerSelectable,
    availabilityMode,
    notes: "Seeded local staff record",
    createdAtIso: now,
    updatedAtIso: now,
  }));

  saveLocalStaff(industrySlug, seeded);
  return seeded;
}
