import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "subs-dev-customer-marketing";

function signature(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCustomerMarketingUnsubscribeToken(input: {
  tenantSiteId: string;
  siteSlug: string;
  customerId: string;
  email: string;
}): string {
  const payload = [
    input.tenantSiteId,
    input.siteSlug,
    input.customerId,
    input.email.trim().toLowerCase(),
    Date.now().toString(),
  ].map(encodeURIComponent).join(".");
  return `${payload}.${signature(payload)}`;
}

export function verifyCustomerMarketingUnsubscribeToken(token: string): {
  tenantSiteId: string;
  siteSlug: string;
  customerId: string;
  email: string;
} | null {
  const parts = token.split(".");
  if (parts.length !== 6) return null;
  const payload = parts.slice(0, 5).join(".");
  const expected = signature(payload);
  const supplied = parts[5] ?? "";
  if (!safeCompare(expected, supplied)) return null;

  const [tenantSiteId, siteSlug, customerId, email] = parts.slice(0, 4).map(decodeURIComponent);
  if (!tenantSiteId || !siteSlug || !customerId || !email) return null;
  return { tenantSiteId, siteSlug, customerId, email: email.trim().toLowerCase() };
}
