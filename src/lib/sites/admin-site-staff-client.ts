import type {
  CustomerSiteStaffMemberInput,
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleInput,
  CustomerSiteStaffRoleRecord,
} from "@/lib/sites/customer-site-staff-types";

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

export async function listPersistedStaffRoles(
  siteId: string,
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff-roles`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; roles?: CustomerSiteStaffRoleRecord[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.roles)) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_ROLES_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function savePersistedStaffRoles(
  siteId: string,
  roles: CustomerSiteStaffRoleInput[],
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff-roles`, {
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
        error: body?.error ?? "STAFF_ROLES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createPersistedStaffRole(
  siteId: string,
  role: CustomerSiteStaffRoleInput,
): Promise<ClientResult<{ role: CustomerSiteStaffRoleRecord }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(role),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; role?: CustomerSiteStaffRoleRecord; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.role) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_ROLE_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, role: body.role };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function deletePersistedStaffRole(
  siteId: string,
  roleId: string,
): Promise<ClientResult<{ deleted: true }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/staff-roles/${encodeURIComponent(roleId)}`,
      { method: "DELETE", headers: { "Content-Type": "application/json" } },
    );
    const body = (await parseJsonSafe(response)) as { ok?: boolean; error?: string; details?: unknown } | null;

    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_ROLE_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, deleted: true };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listPersistedStaff(
  siteId: string,
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staff?: CustomerSiteStaffMemberRecord[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.staff)) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function savePersistedStaff(
  siteId: string,
  staff: CustomerSiteStaffMemberInput[],
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff`, {
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
        error: body?.error ?? "STAFF_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createPersistedStaffMember(
  siteId: string,
  staffMember: CustomerSiteStaffMemberInput,
): Promise<ClientResult<{ staffMember: CustomerSiteStaffMemberRecord }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffMember),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staffMember?: CustomerSiteStaffMemberRecord; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.staffMember) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, staffMember: body.staffMember };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function deletePersistedStaffMember(
  siteId: string,
  staffId: string,
): Promise<ClientResult<{ deleted: true }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/staff/${encodeURIComponent(staffId)}`,
      { method: "DELETE", headers: { "Content-Type": "application/json" } },
    );
    const body = (await parseJsonSafe(response)) as { ok?: boolean; error?: string; details?: unknown } | null;

    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "STAFF_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, deleted: true };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
