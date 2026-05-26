export type PersistedCustomerSiteSettings = {
  id: string;
  tenantSiteId: string;
  siteDisplayName: string | null;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHoursSummary: string | null;
  heroHeadline: string | null;
  heroSubheading: string | null;
  visualThemeId: string | null;
  colourPaletteId: string | null;
  currency: string | null;
  logoUrl: string | null;
  logoStorageKey: string | null;
  logoContentType: string | null;
  logoFileName: string | null;
  faviconUrl: string | null;
  faviconStorageKey: string | null;
  faviconContentType: string | null;
  faviconFileName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersistedCustomerSiteService = {
  id: string;
  tenantSiteId: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  durationMinutes: number | null;
  bufferAfterMinutes: number | null;
  active: boolean;
  sortOrder: number;
  rolePriceOverrides: unknown;
  createdAt: string;
  updatedAt: string;
};

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

export async function getAdminSitePersistedSettings(
  siteId: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings | null }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings | null; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "SITE_SETTINGS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, settings: body.settings ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function patchAdminSitePersistedSettings(
  siteId: string,
  input: Partial<Omit<PersistedCustomerSiteSettings, "id" | "tenantSiteId" | "createdAt" | "updatedAt">>,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/settings`, {
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
        error: body?.error ?? "SITE_SETTINGS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getAdminSitePersistedServices(
  siteId: string,
): Promise<ClientResult<{ services: PersistedCustomerSiteService[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/services`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; services?: PersistedCustomerSiteService[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_SERVICES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, services: body.services };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function putAdminSitePersistedServices(
  siteId: string,
  services: Array<Omit<PersistedCustomerSiteService, "id" | "tenantSiteId" | "createdAt" | "updatedAt"> & { id?: string }>,
): Promise<ClientResult<{ services: PersistedCustomerSiteService[] }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/services`, {
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
        error: body?.error ?? "SITE_SERVICES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, services: body.services };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function postAdminSitePersistedService(
  siteId: string,
  service: Omit<PersistedCustomerSiteService, "id" | "tenantSiteId" | "createdAt" | "updatedAt">,
): Promise<ClientResult<{ service: PersistedCustomerSiteService }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; service?: PersistedCustomerSiteService; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.service) {
      return {
        ok: false,
        error: body?.error ?? "SITE_SERVICE_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, service: body.service };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function deleteAdminSitePersistedService(
  siteId: string,
  serviceId: string,
): Promise<ClientResult<{ deleted: true }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/services/${encodeURIComponent(serviceId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );
    const body = (await parseJsonSafe(response)) as { ok?: boolean; error?: string; details?: unknown } | null;

    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "SITE_SERVICE_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, deleted: true };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
