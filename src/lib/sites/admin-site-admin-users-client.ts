import type { CustomerSiteAdminUserRecord } from "@/lib/sites/customer-site-admin-user-types";

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

export async function listPersistedSiteAdminUsers(
  siteId: string,
): Promise<ClientResult<{ users: CustomerSiteAdminUserRecord[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/site-admin-users`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; users?: CustomerSiteAdminUserRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.users)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_USERS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, users: body.users };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createPersistedSiteAdminUser(
  siteId: string,
  input: {
    email: string;
    displayName?: string | null;
    role?: "OWNER" | "ADMIN";
    active?: boolean;
    invitationStatus?: "INVITED" | "ACTIVE" | "DISABLED";
    accessCode?: string;
  },
): Promise<ClientResult<{ user: CustomerSiteAdminUserRecord; generatedAccessCode: string }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/site-admin-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          user?: CustomerSiteAdminUserRecord;
          generatedAccessCode?: string;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.user || !body.generatedAccessCode) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_USER_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, user: body.user, generatedAccessCode: body.generatedAccessCode };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function patchPersistedSiteAdminUser(
  siteId: string,
  userId: string,
  input: {
    displayName?: string | null;
    role?: "OWNER" | "ADMIN";
    active?: boolean;
    invitationStatus?: "INVITED" | "ACTIVE" | "DISABLED";
    accessCode?: string;
  },
): Promise<ClientResult<{ user: CustomerSiteAdminUserRecord }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/site-admin-users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; user?: CustomerSiteAdminUserRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.user) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_USER_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, user: body.user };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

