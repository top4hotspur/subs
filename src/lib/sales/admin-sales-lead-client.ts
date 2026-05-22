type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;

type ClientResult<T> = ClientSuccess<T> | ClientFailure;

export type SalesLeadDto = {
  id: string;
  businessName: string;
  location?: string | null;
  industrySlug?: string | null;
  industryLabel?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  source?: string | null;
  notes?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
  events?: Array<{ id: string; eventType: string; message?: string | null; createdAt: string }>;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listBackendSalesLeads(options?: {
  search?: string;
  status?: string;
  industrySlug?: string;
  location?: string;
}) {
  const searchParams = new URLSearchParams();
  if (options?.search) searchParams.set("search", options.search);
  if (options?.status) searchParams.set("status", options.status);
  if (options?.industrySlug) searchParams.set("industrySlug", options.industrySlug);
  if (options?.location) searchParams.set("location", options.location);

  try {
    const response = await fetch(`/api/admin/sales-leads?${searchParams.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; leads?: SalesLeadDto[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.leads)) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_LIST_FAILED",
        status: response.status,
        details: body?.details,
      } as ClientFailure;
    }

    return { ok: true, leads: body.leads } as ClientSuccess<{ leads: SalesLeadDto[] }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}

export async function createBackendSalesLead(payload: Record<string, unknown>): Promise<ClientResult<{ lead: SalesLeadDto }>> {
  try {
    const response = await fetch("/api/admin/sales-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; lead?: SalesLeadDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.lead) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, lead: body.lead };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getBackendSalesLead(id: string): Promise<ClientResult<{ lead: SalesLeadDto }>> {
  try {
    const response = await fetch(`/api/admin/sales-leads/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; lead?: SalesLeadDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.lead) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_READ_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, lead: body.lead };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateBackendSalesLead(
  id: string,
  patch: Record<string, unknown>,
): Promise<ClientResult<{ lead: SalesLeadDto }>> {
  try {
    const response = await fetch(`/api/admin/sales-leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; lead?: SalesLeadDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.lead) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, lead: body.lead };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function markBackendSalesLeadContacted(
  id: string,
  status?: string,
): Promise<ClientResult<{ lead: SalesLeadDto }>> {
  return updateBackendSalesLead(id, { action: "MARK_CONTACTED", status });
}
