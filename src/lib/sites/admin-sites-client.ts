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

export type AdminSiteDomainSummary = {
  id: string;
  domain: string;
  domainType: string;
  status: string;
  registrarNotes?: string | null;
  dnsInstructions?: unknown;
  createdAt: string;
};

export type AdminSiteLifecycleAction =
  | "MARK_DOMAIN_SEARCH_STARTED"
  | "MARK_DOMAIN_PURCHASED_MANUALLY"
  | "MARK_DNS_INSTRUCTIONS_SENT"
  | "MARK_WAITING_FOR_CUSTOMER_DNS"
  | "MARK_DNS_CONFIGURED"
  | "MARK_DOMAIN_READY"
  | "MARK_SITE_LIVE"
  | "SUSPEND_SITE"
  | "REACTIVATE_SITE";

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listAdminTenantSites(): Promise<ClientResult<{ sites: AdminTenantSiteSummary[] }>> {
  try {
    const response = await fetch("/api/admin/sites?take=100", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
  setupRequestId: string,
): Promise<ClientResult<{ tenantSite: AdminTenantSiteSummary; created: boolean }>> {
  try {
    const response = await fetch("/api/admin/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      dnsInstructions?: unknown;
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

export async function applyAdminSiteLifecycleAction(
  siteId: string,
  action: AdminSiteLifecycleAction,
): Promise<ClientResult<{ site: AdminTenantSiteSummary; action: AdminSiteLifecycleAction; emailSent?: boolean; emailStatus?: string | null }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/lifecycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; site?: AdminTenantSiteSummary; action?: AdminSiteLifecycleAction; emailSent?: boolean; emailStatus?: string | null; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.site || !body.action) {
      return {
        ok: false,
        error: body?.error ?? "SITE_LIFECYCLE_ACTION_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, site: body.site, action: body.action, emailSent: Boolean(body.emailSent), emailStatus: body.emailStatus ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveAdminSiteDomain(
  siteId: string,
  input: {
    domain: string;
    domainType: "PRIMARY" | "APEX" | "WWW" | "ALIAS";
    status: string;
    registrarNotes?: string | null;
    dnsInstructions?: unknown;
  },
): Promise<ClientResult<{
  domain: AdminSiteDomainSummary;
  domains: AdminSiteDomainSummary[];
}>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          domain?: AdminSiteDomainSummary;
          domains?: AdminSiteDomainSummary[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.domain || !Array.isArray(body.domains)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_DOMAIN_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, domain: body.domain, domains: body.domains };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function emailAdminSiteDnsInstructions(
  siteId: string,
  siteDomainId?: string,
): Promise<
  ClientResult<{
    emailSent: boolean;
    emailStatus: string;
    recommendedNextStatus?: string | null;
    domain?: AdminSiteDomainSummary;
  }>
> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/dns-instructions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteDomainId }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          emailSent?: boolean;
          emailStatus?: string;
          recommendedNextStatus?: string | null;
          domain?: AdminSiteDomainSummary;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "DNS_INSTRUCTIONS_EMAIL_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return {
      ok: true,
      emailSent: Boolean(body.emailSent),
      emailStatus: body.emailStatus ?? "UNKNOWN",
      recommendedNextStatus: body.recommendedNextStatus ?? null,
      domain: body.domain,
    };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

