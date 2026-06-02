import type {
  PersistedCustomerSiteServiceCategory,
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";
import type {
  CustomerSiteStaffMemberInput,
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleInput,
  CustomerSiteStaffRoleRecord,
} from "@/lib/sites/customer-site-staff-types";
import type {
  CustomerSiteSchedulingSnapshot,
  CustomerSiteBusinessClosureInput,
  CustomerSiteStaffBreakWindowInput,
  CustomerSiteStaffHolidayInput,
  CustomerSiteStaffRotaDayInput,
} from "@/lib/sites/customer-site-scheduling-types";
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import type { CustomerSiteAvailabilityResult } from "@/lib/sites/customer-site-availability";

type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;
type ClientResult<T> = ClientSuccess<T> | ClientFailure;

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getSiteAdminSettings(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings | null }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/settings`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings | null; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SETTINGS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function patchSiteAdminSettings(
  siteSlug: string,
  input: Partial<Omit<PersistedCustomerSiteSettings, "id" | "tenantSiteId" | "createdAt" | "updatedAt">>,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SETTINGS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminServices(
  siteSlug: string,
): Promise<ClientResult<{ services: PersistedCustomerSiteService[]; categories: PersistedCustomerSiteServiceCategory[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`);
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          services?: PersistedCustomerSiteService[];
          categories?: PersistedCustomerSiteServiceCategory[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services, categories: body.categories ?? [] };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function putSiteAdminServices(
  siteSlug: string,
  services: Array<
    Omit<PersistedCustomerSiteService, "tenantSiteId" | "createdAt" | "updatedAt" | "id"> & {
      id?: string;
    }
  >,
  categories: Array<
    Omit<PersistedCustomerSiteServiceCategory, "tenantSiteId" | "createdAt" | "updatedAt" | "id"> & {
      id?: string;
    }
  > = [],
): Promise<ClientResult<{ services: PersistedCustomerSiteService[]; categories: PersistedCustomerSiteServiceCategory[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services, categories }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          services?: PersistedCustomerSiteService[];
          categories?: PersistedCustomerSiteServiceCategory[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services, categories: body.categories ?? [] };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminStaffRoles(
  siteSlug: string,
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff-roles`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; roles?: CustomerSiteStaffRoleRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.roles)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_ROLES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminStaffRoles(
  siteSlug: string,
  roles: CustomerSiteStaffRoleInput[],
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff-roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; roles?: CustomerSiteStaffRoleRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.roles)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_ROLES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminStaff(
  siteSlug: string,
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staff?: CustomerSiteStaffMemberRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.staff)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminStaff(
  siteSlug: string,
  staff: CustomerSiteStaffMemberInput[],
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staff?: CustomerSiteStaffMemberRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.staff)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminScheduling(
  siteSlug: string,
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/scheduling`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SCHEDULING_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminScheduling(
  siteSlug: string,
  snapshot: {
    rotaDays: CustomerSiteStaffRotaDayInput[];
    breakWindows: CustomerSiteStaffBreakWindowInput[];
    businessClosures: CustomerSiteBusinessClosureInput[];
    staffHolidays: CustomerSiteStaffHolidayInput[];
  },
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/scheduling`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SCHEDULING_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminBookings(
  siteSlug: string,
  take = 20,
): Promise<ClientResult<{ bookings: CustomerSiteBookingRecord[] }>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/bookings?take=${encodeURIComponent(String(take))}`,
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; bookings?: CustomerSiteBookingRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.bookings)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKINGS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, bookings: body.bookings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateSiteAdminBookingStatus(
  siteSlug: string,
  input: { bookingId: string; status: CustomerSiteBookingRecord["status"]; notes?: string | null },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKING_STATUS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function amendSiteAdminBooking(
  siteSlug: string,
  input: {
    bookingId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string | null;
    status?: CustomerSiteBookingRecord["status"];
    serviceId?: string;
    staffMemberId?: string | null;
    preferredDate?: string;
    preferredTime?: string;
  },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "amend", ...input }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKING_AMEND_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminAvailability(
  siteSlug: string,
  options: { serviceId: string; staffId?: string | null; date: string; excludeBookingId?: string | null },
): Promise<ClientResult<{ availability: CustomerSiteAvailabilityResult }>> {
  try {
    const params = new URLSearchParams({
      serviceId: options.serviceId,
      date: options.date,
    });
    if (options.staffId) params.set("staffId", options.staffId);
    if (options.excludeBookingId) params.set("excludeBookingId", options.excludeBookingId);
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/availability?${params.toString()}`,
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; availability?: CustomerSiteAvailabilityResult; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.availability) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_AVAILABILITY_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, availability: body.availability };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function uploadSiteAdminBrandingLogo(
  siteSlug: string,
  file: File,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/branding/logo`, {
      method: "POST",
      body: formData,
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_LOGO_UPLOAD_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function removeSiteAdminBrandingLogo(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/branding/logo`, {
      method: "DELETE",
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_LOGO_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function uploadSiteAdminBrandingFavicon(
  siteSlug: string,
  file: File,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/branding/favicon`,
      {
        method: "POST",
        body: formData,
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_FAVICON_UPLOAD_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function removeSiteAdminBrandingFavicon(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/branding/favicon`,
      {
        method: "DELETE",
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_FAVICON_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
