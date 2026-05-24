import type {
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";

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
): Promise<ClientResult<{ services: PersistedCustomerSiteService[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; services?: PersistedCustomerSiteService[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services };
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
): Promise<ClientResult<{ services: PersistedCustomerSiteService[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; services?: PersistedCustomerSiteService[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
