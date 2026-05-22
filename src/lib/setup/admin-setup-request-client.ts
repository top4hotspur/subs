import { listSetupRequestsSchema } from "@/lib/setup/setup-request-schema";

type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = {
  ok: true;
} & T;

export type AdminSetupRequestClientResult<T> = ClientSuccess<T> | ClientFailure;

export type BackendSetupRequestRecord = {
  id: string;
  tenantSiteId?: string | null;
  demoDraftSnapshotId?: string | null;
  industrySlug: string;
  businessName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  domainOption: string;
  existingDomain?: string | null;
  desiredDomain?: string | null;
  communicationOption: string;
  setupTotalGbp: number;
  monthlyTotalGbp: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListBackendSetupRequestsOptions = Partial<Pick<
  ReturnType<typeof listSetupRequestsSchema.parse>,
  "industrySlug" | "status" | "contactEmail" | "take" | "skip"
>>;

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildQuery(options?: ListBackendSetupRequestsOptions): string {
  if (!options) return "";
  const query = new URLSearchParams();
  if (options.industrySlug) query.set("industrySlug", options.industrySlug);
  if (options.status) query.set("status", options.status);
  if (options.contactEmail) query.set("contactEmail", options.contactEmail);
  if (typeof options.take === "number") query.set("take", String(options.take));
  if (typeof options.skip === "number") query.set("skip", String(options.skip));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listBackendSetupRequests(
  adminEmail: string,
  options?: ListBackendSetupRequestsOptions,
): Promise<AdminSetupRequestClientResult<{ setupRequests: BackendSetupRequestRecord[] }>> {
  try {
    const response = await fetch(`/api/setup-requests${buildQuery(options)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-platform-admin-email": adminEmail,
      },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; setupRequests?: BackendSetupRequestRecord[]; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !Array.isArray(body.setupRequests)) {
      return {
        ok: false,
        error: body?.error ?? "SETUP_REQUEST_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, setupRequests: body.setupRequests };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getBackendSetupRequest(
  id: string,
): Promise<AdminSetupRequestClientResult<{ setupRequest: BackendSetupRequestRecord }>> {
  try {
    const response = await fetch(`/api/setup-requests/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; setupRequest?: BackendSetupRequestRecord; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.setupRequest) {
      return {
        ok: false,
        error: body?.error ?? "SETUP_REQUEST_READ_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, setupRequest: body.setupRequest };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateBackendSetupRequestStatus(
  adminEmail: string,
  id: string,
  status: string,
): Promise<AdminSetupRequestClientResult<{ setupRequest: BackendSetupRequestRecord }>> {
  try {
    const response = await fetch(`/api/setup-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-platform-admin-email": adminEmail,
      },
      body: JSON.stringify({ status }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; setupRequest?: BackendSetupRequestRecord; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.setupRequest) {
      return {
        ok: false,
        error: body?.error ?? "SETUP_REQUEST_STATUS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, setupRequest: body.setupRequest };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
