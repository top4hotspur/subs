import type {
  CustomerSiteBookingListOptions,
  CustomerSiteBookingRecord,
  CustomerSiteBookingStatus,
  CustomerSitePaymentStatus,
} from "@/lib/sites/customer-site-booking-types";

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

export async function listPersistedBookings(
  siteId: string,
  options: Partial<CustomerSiteBookingListOptions> = {},
): Promise<ClientResult<{ bookings: CustomerSiteBookingRecord[] }>> {
  try {
    const params = new URLSearchParams();
    if (options.status) params.set("status", options.status);
    if (options.preferredDate) params.set("preferredDate", options.preferredDate);
    if (typeof options.take === "number") params.set("take", String(options.take));
    if (typeof options.skip === "number") params.set("skip", String(options.skip));
    const query = params.toString();

    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/bookings${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; bookings?: CustomerSiteBookingRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.bookings)) {
      return {
        ok: false,
        error: body?.error ?? "BOOKINGS_LIST_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, bookings: body.bookings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createPersistedBooking(
  siteId: string,
  booking: {
    serviceId?: string;
    serviceName?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    preferredDate?: string;
    preferredTime?: string;
    staffMemberId?: string;
    staffName?: string;
    status?: CustomerSiteBookingStatus;
    paymentStatus?: CustomerSitePaymentStatus;
    notes?: string;
    source?: string;
    rawPayload?: unknown;
  },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "BOOKING_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updatePersistedBookingStatus(
  siteId: string,
  bookingId: string,
  input: {
    status: CustomerSiteBookingStatus;
    paymentStatus?: CustomerSitePaymentStatus;
    notes?: string;
  },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(
      `/api/admin/sites/${encodeURIComponent(siteId)}/bookings/${encodeURIComponent(bookingId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "BOOKING_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

