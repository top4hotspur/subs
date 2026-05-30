type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;

export type SalesCampaignDto = {
  id: string;
  name: string;
  industrySlug?: string | null;
  serviceArea?: string | null;
  campaignLevel: "LAUNCH_OFFER" | "INTRODUCTION" | "REMINDER";
  status: "DRAFT" | "PREPARED" | "SENT" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  recipients?: Array<{ id: string; leadId: string; status: string }>;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listBackendSalesCampaigns() {
  try {
    const response = await fetch("/api/admin/sales-campaigns", { method: "GET" });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; campaigns?: SalesCampaignDto[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.campaigns)) {
      return {
        ok: false,
        error: body?.error ?? "SALES_CAMPAIGN_LIST_FAILED",
        status: response.status,
        details: body?.details,
      } as ClientFailure;
    }
    return { ok: true, campaigns: body.campaigns } as ClientSuccess<{ campaigns: SalesCampaignDto[] }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}

export async function createBackendSalesCampaign(payload: Record<string, unknown>) {
  try {
    const response = await fetch("/api/admin/sales-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; campaign?: SalesCampaignDto; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.campaign) {
      return {
        ok: false,
        error: body?.error ?? "SALES_CAMPAIGN_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      } as ClientFailure;
    }
    return { ok: true, campaign: body.campaign } as ClientSuccess<{ campaign: SalesCampaignDto }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}

export async function updateBackendSalesCampaign(id: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch(`/api/admin/sales-campaigns/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; campaign?: SalesCampaignDto; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.campaign) {
      return {
        ok: false,
        error: body?.error ?? "SALES_CAMPAIGN_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      } as ClientFailure;
    }
    return { ok: true, campaign: body.campaign } as ClientSuccess<{ campaign: SalesCampaignDto }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}
