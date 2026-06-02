import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SITE_STAFF_SESSION_COOKIE = "subs_site_staff_session";

export type SiteStaffSessionContext = {
  tenantSiteId: string;
  tenantSlug: string;
  staffMemberId: string;
  staffDisplayName: string;
  email: string;
  issuedAt: number;
};

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "subs-dev-site-staff-session"
  );
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function isValidSignature(payload: string, signature: string): boolean {
  const expected = Buffer.from(signPayload(payload), "base64url");
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function createSiteStaffSessionToken(context: Omit<SiteStaffSessionContext, "issuedAt">): string {
  const payload = encodeBase64Url(
    JSON.stringify({
      version: 1,
      tenantSiteId: context.tenantSiteId,
      tenantSlug: context.tenantSlug,
      staffMemberId: context.staffMemberId,
      staffDisplayName: context.staffDisplayName,
      email: context.email,
      issuedAt: Math.floor(Date.now() / 1000),
    }),
  );
  return `${payload}.${signPayload(payload)}`;
}

export function verifySiteStaffSessionToken(token: string | undefined): SiteStaffSessionContext | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !isValidSignature(payload, signature)) return null;

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as Partial<SiteStaffSessionContext> & {
      version?: number;
    };
    if (decoded.version !== 1) return null;
    if (
      !decoded.tenantSiteId ||
      !decoded.tenantSlug ||
      !decoded.staffMemberId ||
      !decoded.staffDisplayName ||
      !decoded.email ||
      typeof decoded.issuedAt !== "number"
    ) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (decoded.issuedAt + SESSION_TTL_SECONDS < now) return null;
    return {
      tenantSiteId: decoded.tenantSiteId,
      tenantSlug: decoded.tenantSlug,
      staffMemberId: decoded.staffMemberId,
      staffDisplayName: decoded.staffDisplayName,
      email: decoded.email,
      issuedAt: decoded.issuedAt,
    };
  } catch {
    return null;
  }
}

export async function getSiteStaffSessionContext(): Promise<SiteStaffSessionContext | null> {
  const cookieStore = await cookies();
  return verifySiteStaffSessionToken(cookieStore.get(SITE_STAFF_SESSION_COOKIE)?.value);
}

export function setSiteStaffSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SITE_STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/site-staff",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSiteStaffSessionCookie(response: NextResponse): void {
  response.cookies.set(SITE_STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/site-staff",
    maxAge: 0,
  });
}
