type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;

type ClientResult<T> = ClientSuccess<T> | ClientFailure;

export type AdminTenantSiteSummary = {
  id: string;
  slug: string;
  displayName: string;
  industrySlug?: string | null;
  status: string;
  domainPrimary?: string | null;
  provisioningStatus?: string | null;
  subscriptionStatus?: string | null;
  domainStatus?: string | null;
  whatsappAddonEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  siteDomains?: Array<{ id: string; domain: string; domainType: string; status: string }>;
  subscriptions?: Array<{
    id: string;
    status: string;
    setupFeeGbp: number;
    monthlyFeeGbp: number;
    domainFeeGbp: number;
    whatsappAddonEnabled: boolean;
  }>;
  setupRequest?: {
    id: string;
    domainOption?: string | null;
    existingDomain?: string | null;
    desiredDomain?: string | null;
  } | null;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listAdminTenantSites(
  adminEmail: string,
): Promise<ClientResult<{ sites: AdminTenantSiteSummary[] }>> {
  try {
    const response = await fetch("/api/admin/sites?take=100", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-platform-admin-email": adminEmail,
      },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; sites?: AdminTenantSiteSummary[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.sites)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, sites: body.sites };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createAdminTenantSiteFromSetupRequest(
  adminEmail: string,
  setupRequestId: string,
): Promise<ClientResult<{ tenantSite: AdminTenantSiteSummary; created: boolean }>> {
  try {
    const response = await fetch("/api/admin/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform-admin-email": adminEmail,
      },
      body: JSON.stringify({ setupRequestId }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          tenantSite?: AdminTenantSiteSummary;
          created?: boolean;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.tenantSite || typeof body.created !== "boolean") {
      return {
        ok: false,
        error: body?.error ?? "SITE_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, tenantSite: body.tenantSite, created: body.created };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getAdminTenantSiteDetail(
  adminEmail: string,
  id: string,
): Promise<
  ClientResult<{
    site: AdminTenantSiteSummary;
    domains: Array<{
      id: string;
      domain: string;
      domainType: string;
      status: string;
      registrarNotes?: string | null;
      createdAt: string;
    }>;
    tasks: Array<{
      id: string;
      taskType: string;
      status: string;
      title: string;
      notes?: string | null;
    }>;
    statusEvents: Array<{
      id: string;
      eventType: string;
      message?: string | null;
      createdAt: string;
    }>;
    subscription: {
      id: string;
      status: string;
      setupFeeGbp: number;
      monthlyFeeGbp: number;
      domainFeeGbp: number;
      whatsappAddonEnabled: boolean;
    } | null;
  }>
> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-platform-admin-email": adminEmail,
      },
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          site?: AdminTenantSiteSummary;
          domains?: unknown[];
          tasks?: unknown[];
          statusEvents?: unknown[];
          subscription?: unknown;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.site) {
      return {
        ok: false,
        error: body?.error ?? "SITE_DETAIL_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return {
      ok: true,
      site: body.site,
      domains: Array.isArray(body.domains) ? (body.domains as never[]) : [],
      tasks: Array.isArray(body.tasks) ? (body.tasks as never[]) : [],
      statusEvents: Array.isArray(body.statusEvents) ? (body.statusEvents as never[]) : [],
      subscription: (body.subscription as never) ?? null,
    };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateAdminSiteTaskStatus(
  adminEmail: string,
  siteId: string,
  taskId: string,
  status: string,
): Promise<ClientResult<{ task: { id: string; status: string; title: string } }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-platform-admin-email": adminEmail,
        },
        body: JSON.stringify({ status }),
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; task?: { id: string; status: string; title: string }; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.task) {
      return {
        ok: false,
        error: body?.error ?? "TASK_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, task: body.task };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

