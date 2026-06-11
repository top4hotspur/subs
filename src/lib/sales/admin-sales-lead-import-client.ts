type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;
type ClientResult<T> = ClientSuccess<T> | ClientFailure;

export type SalesLeadImportRowDto = {
  id: string;
  batchId: string;
  sourceUrl: string;
  extractedBusinessName?: string | null;
  extractedAddress?: string | null;
  extractedPostcode?: string | null;
  extractedPhone?: string | null;
  extractedWebsite?: string | null;
  extractedEmail?: string | null;
  leadSource?: string | null;
  currentProvider?: string | null;
  estimatedCurrentMonthlyCost?: string | number | null;
  industrySlug?: string | null;
  cityTown?: string | null;
  status: string;
  emailEnrichmentStatus: string;
  duplicateReason?: string | null;
  notes?: string | null;
  raw?: Record<string, unknown> | null;
  approvedLeadId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalesLeadImportBatchDto = {
  id: string;
  sourceType?: string | null;
  defaultIndustrySlug?: string | null;
  defaultCityTown?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  rows: SalesLeadImportRowDto[];
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function listBackendSalesLeadImportBatches(): Promise<ClientResult<{ batches: SalesLeadImportBatchDto[] }>> {
  try {
    const response = await fetch("/api/admin/sales-lead-imports", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; batches?: SalesLeadImportBatchDto[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.batches)) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_IMPORT_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, batches: body.batches };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createBackendSalesLeadImportBatch(payload: {
  sourceUrls: string[];
  sourceType?: string;
  defaultIndustrySlug?: string;
  defaultCityTown?: string;
}): Promise<ClientResult<{ batch: SalesLeadImportBatchDto }>> {
  try {
    const response = await fetch("/api/admin/sales-lead-imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; batch?: SalesLeadImportBatchDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.batch) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_IMPORT_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, batch: body.batch };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateBackendSalesLeadImportRow(
  rowId: string,
  patch: Record<string, unknown>,
): Promise<ClientResult<{ row: SalesLeadImportRowDto }>> {
  try {
    const response = await fetch(`/api/admin/sales-lead-imports/rows/${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; row?: SalesLeadImportRowDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.row) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_IMPORT_ROW_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, row: body.row };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function markBackendSalesLeadImportRowForEmailResearch(
  rowId: string,
): Promise<ClientResult<{ row: SalesLeadImportRowDto }>> {
  try {
    const response = await fetch(`/api/admin/sales-lead-imports/rows/${encodeURIComponent(rowId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_EMAIL_RESEARCH" }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; row?: SalesLeadImportRowDto; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.row) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_IMPORT_ROW_ACTION_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, row: body.row };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function approveBackendSalesLeadImportRows(
  batchId: string,
  rowIds: string[],
  approveDuplicates: boolean,
): Promise<ClientResult<{ result: { batch: SalesLeadImportBatchDto | null; approvedLeadIds: string[]; skipped: Array<{ rowId: string; reason: string }> } }>> {
  try {
    const response = await fetch(`/api/admin/sales-lead-imports/${encodeURIComponent(batchId)}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIds, approveDuplicates }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          result?: {
            batch: SalesLeadImportBatchDto | null;
            approvedLeadIds: string[];
            skipped: Array<{ rowId: string; reason: string }>;
          };
          error?: string;
          details?: unknown;
        }
      | null;

    if (!response.ok || !body?.ok || !body.result) {
      return {
        ok: false,
        error: body?.error ?? "SALES_LEAD_IMPORT_APPROVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, result: body.result };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
