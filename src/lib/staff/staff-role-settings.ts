import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type StaffRoleDefinition = {
  id: string;
  label: string;
  platformRole?: string;
  active: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

function key(slug: WebsiteTemplateSlug): string {
  return `subs-staff-roles:${slug}`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `staff_role_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parse(raw: string | null): StaffRoleDefinition[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StaffRoleDefinition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSeed(slug: WebsiteTemplateSlug): StaffRoleDefinition[] {
  const now = new Date().toISOString();
  const labels =
    slug === "barbers"
      ? ["Barber", "Senior Barber", "Apprentice Barber"]
      : slug === "hairdressers"
        ? ["Stylist", "Senior Stylist", "Colourist"]
        : slug === "nail-salon"
          ? ["Nail Technician", "Senior Nail Technician"]
          : slug === "taxi"
            ? ["Driver", "Dispatcher", "Admin"]
            : ["Owner", "Admin", "General Staff"];

  return labels.map((label) => ({
    id: generateId(),
    label,
    platformRole: undefined,
    active: true,
    createdAtIso: now,
    updatedAtIso: now,
  }));
}

export function listLocalStaffRoles(industrySlug: WebsiteTemplateSlug): StaffRoleDefinition[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(key(industrySlug)));
}

export function saveLocalStaffRoles(
  industrySlug: WebsiteTemplateSlug,
  roles: StaffRoleDefinition[],
): StaffRoleDefinition[] {
  if (typeof window === "undefined") return roles;
  window.localStorage.setItem(key(industrySlug), JSON.stringify(roles));
  return roles;
}

export function seedLocalStaffRoles(industrySlug: WebsiteTemplateSlug): StaffRoleDefinition[] {
  const existing = listLocalStaffRoles(industrySlug);
  if (existing.length > 0) return existing;
  const seeded = buildSeed(industrySlug);
  return saveLocalStaffRoles(industrySlug, seeded);
}

export function resetLocalStaffRoles(industrySlug: WebsiteTemplateSlug): StaffRoleDefinition[] {
  const seeded = buildSeed(industrySlug);
  return saveLocalStaffRoles(industrySlug, seeded);
}
