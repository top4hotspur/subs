type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;

export type SalesProviderPricingDto = {
  id: string;
  providerKey: string;
  providerName: string;
  estimatedMonthlyGbp?: string | number | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listBackendSalesProviderPricing() {
  try {
    const response = await fetch("/api/admin/sales-provider-pricing");
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; providers?: SalesProviderPricingDto[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.providers)) {
      return { ok: false, error: body?.error ?? "SALES_PROVIDER_LIST_FAILED", status: response.status, details: body?.details } as ClientFailure;
    }
    return { ok: true, providers: body.providers } as ClientSuccess<{ providers: SalesProviderPricingDto[] }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}

export async function saveBackendSalesProviderPricing(payload: Record<string, unknown>) {
  try {
    const response = await fetch("/api/admin/sales-provider-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; provider?: SalesProviderPricingDto; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.provider) {
      return { ok: false, error: body?.error ?? "SALES_PROVIDER_SAVE_FAILED", status: response.status, details: body?.details } as ClientFailure;
    }
    return { ok: true, provider: body.provider } as ClientSuccess<{ provider: SalesProviderPricingDto }>;
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 } as ClientFailure;
  }
}
