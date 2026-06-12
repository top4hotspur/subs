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

export async function createPublicSiteBooking(
  siteSlug: string,
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
    notes?: string;
    policyAccepted?: boolean;
  },
): Promise<ClientResult<{ bookingId: string; bookingUrl?: string | null; checkoutUrl?: string | null }>> {
  try {
    const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          booking?: { id?: string };
          bookingUrl?: string | null;
          checkoutUrl?: string | null;
          error?: string;
          details?: unknown;
        }
      | null;

    if (!response.ok || !body?.ok || !body.booking?.id) {
      return {
        ok: false,
        error: body?.error ?? "BOOKING_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return {
      ok: true,
      bookingId: body.booking.id,
      bookingUrl: body.bookingUrl ?? null,
      checkoutUrl: body.checkoutUrl ?? null,
    };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
