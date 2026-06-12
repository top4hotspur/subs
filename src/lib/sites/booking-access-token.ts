import { createHmac, timingSafeEqual } from "crypto";

const SECRET =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  "subs-dev-booking-access";

type BookingAccessTokenPayload = {
  v: 1;
  tenantSiteId: string;
  siteSlug: string;
  bookingId: string;
  iat: number;
};

function signature(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodePayload(payload: BookingAccessTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): BookingAccessTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<BookingAccessTokenPayload>;
    if (
      parsed.v !== 1 ||
      typeof parsed.tenantSiteId !== "string" ||
      typeof parsed.siteSlug !== "string" ||
      typeof parsed.bookingId !== "string" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }
    return {
      v: 1,
      tenantSiteId: parsed.tenantSiteId,
      siteSlug: parsed.siteSlug,
      bookingId: parsed.bookingId,
      iat: parsed.iat,
    };
  } catch {
    return null;
  }
}

export function createBookingAccessToken(input: {
  tenantSiteId: string;
  siteSlug: string;
  bookingId: string;
}): string {
  const payload = encodePayload({
    v: 1,
    tenantSiteId: input.tenantSiteId,
    siteSlug: input.siteSlug,
    bookingId: input.bookingId,
    iat: Date.now(),
  });
  return `${payload}.${signature(payload)}`;
}

export function verifyBookingAccessToken(token: string): BookingAccessTokenPayload | null {
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  if (!safeEquals(signature(payload), sig)) return null;
  return decodePayload(payload);
}

export function createBookingAccessPath(input: {
  siteSlug: string;
  tenantSiteId: string;
  bookingId: string;
  publicBasePath?: string;
}): string {
  const token = createBookingAccessToken(input);
  const basePath = input.publicBasePath ?? `/sites/${encodeURIComponent(input.siteSlug)}`;
  return `${basePath}/booking/${encodeURIComponent(token)}`;
}

export function createBookingAccessUrl(input: {
  baseUrl?: string | null;
  siteSlug: string;
  tenantSiteId: string;
  bookingId: string;
  publicBasePath?: string;
}): string {
  const path = createBookingAccessPath(input);
  const baseUrl = input.baseUrl?.replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}${path}` : path;
}
