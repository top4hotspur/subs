import {
  createSetupRequestSchema,
} from "@/lib/setup/setup-request-schema";

type BackendClientSuccess<T> = {
  ok: true;
  setupRequest: T;
  confirmationToken?: string;
  confirmationUrl?: string;
};

type BackendClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type BackendClientResult<T> = BackendClientSuccess<T> | BackendClientFailure;

export type BackendSetupRequestRecord = {
  id: string;
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

export type SubmitSetupRequestPayload = ReturnType<typeof createSetupRequestSchema.parse>;

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitSetupRequestToBackend(
  payload: SubmitSetupRequestPayload,
): Promise<BackendClientResult<BackendSetupRequestRecord>> {
  try {
    const response = await fetch("/api/setup-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          setupRequest?: BackendSetupRequestRecord;
          confirmationToken?: string;
          confirmationUrl?: string;
          error?: string;
          details?: unknown;
        }
      | null;

    if (!response.ok || !body?.ok || !body.setupRequest) {
      return {
        ok: false,
        error: body?.error ?? "SETUP_REQUEST_BACKEND_SUBMIT_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return {
      ok: true,
      setupRequest: body.setupRequest,
      confirmationToken: body.confirmationToken,
      confirmationUrl: body.confirmationUrl,
    };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      status: 0,
    };
  }
}

export async function getSetupRequestFromBackend(
  id: string,
  token?: string,
): Promise<BackendClientResult<BackendSetupRequestRecord>> {
  try {
    const path = token
      ? `/api/setup-requests/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`
      : `/api/setup-requests/${encodeURIComponent(id)}`;
    const response = await fetch(path, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; setupRequest?: BackendSetupRequestRecord; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.setupRequest) {
      return {
        ok: false,
        error: body?.error ?? "SETUP_REQUEST_BACKEND_FETCH_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, setupRequest: body.setupRequest };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      status: 0,
    };
  }
}
