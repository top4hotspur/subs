import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SITE_CUSTOMER_SESSION_COOKIE = "subs_site_customer_session";

export type SiteCustomerSessionContext = {
  tenantSiteId: string;
  tenantSlug: string;
  customerId: string;
  email: string;
  issuedAt: number;
};

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "subs-dev-site-customer-session"
  );
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

export function createSiteCustomerSessionToken(
  context: Omit<SiteCustomerSessionContext, "issuedAt">,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      tenantSiteId: context.tenantSiteId,
      tenantSlug: context.tenantSlug,
      customerId: context.customerId,
      email: context.email,
      issuedAt: Math.floor(Date.now() / 1000),
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifySiteCustomerSessionToken(token: string | undefined): SiteCustomerSessionContext | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined || !isValidSignature(payload, signature)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SiteCustomerSessionContext> & {
      version?: number;
    };
    if (
      decoded.version !== 1 ||
      !decoded.tenantSiteId ||
      !decoded.tenantSlug ||
      !decoded.customerId ||
      !decoded.email ||
      typeof decoded.issuedAt !== "number"
    ) {
      return null;
    }
    if (decoded.issuedAt + SESSION_TTL_SECONDS < Math.floor(Date.now() / 1000)) return null;
    return {
      tenantSiteId: decoded.tenantSiteId,
      tenantSlug: decoded.tenantSlug,
      customerId: decoded.customerId,
      email: decoded.email,
      issuedAt: decoded.issuedAt,
    };
  } catch {
    return null;
  }
}

export async function getSiteCustomerSessionContext(): Promise<SiteCustomerSessionContext | null> {
  const cookieStore = await cookies();
  return verifySiteCustomerSessionToken(cookieStore.get(SITE_CUSTOMER_SESSION_COOKIE)?.value);
}

export function setSiteCustomerSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SITE_CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  clearLegacySiteCustomerSessionCookie(response);
}

export function clearSiteCustomerSessionCookie(response: NextResponse): void {
  response.cookies.set(SITE_CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  clearLegacySiteCustomerSessionCookie(response);
}

function clearLegacySiteCustomerSessionCookie(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${SITE_CUSTOMER_SESSION_COOKIE}=; Path=/sites; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
  );
}
