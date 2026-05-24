import type {
  CustomerSiteSchedulingSnapshot,
  CustomerSiteStaffBreakWindowInput,
  CustomerSiteStaffHolidayInput,
  CustomerSiteStaffRotaDayInput,
  CustomerSiteBusinessClosureInput,
} from "@/lib/sites/customer-site-scheduling-types";

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

export async function getPersistedScheduling(
  siteId: string,
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/scheduling`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SCHEDULING_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function savePersistedScheduling(
  siteId: string,
  snapshot: {
    rotaDays: CustomerSiteStaffRotaDayInput[];
    breakWindows: CustomerSiteStaffBreakWindowInput[];
    businessClosures: CustomerSiteBusinessClosureInput[];
    staffHolidays: CustomerSiteStaffHolidayInput[];
  },
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/scheduling`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;

    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SCHEDULING_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }

    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
