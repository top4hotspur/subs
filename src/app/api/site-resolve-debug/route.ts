import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { getTenantSiteByDomainHost, normalizeHost } from "@/lib/sites/tenant-resolver";

export async function GET(request: NextRequest) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const testHost = request.headers.get("x-test-site-host");
  const receivedHost = testHost?.trim() || forwardedHost || host || "";
  const normalizedHost = normalizeHost(receivedHost);
  const match = await getTenantSiteByDomainHost(receivedHost);

  return NextResponse.json({
    ok: true,
    hostReceived: receivedHost || null,
    normalizedHost: normalizedHost || null,
    matched: Boolean(match),
    tenantSiteId: match?.tenantSiteId ?? null,
    tenantSlug: match?.tenantSlug ?? null,
    domainStatus: match?.domainStatus ?? null,
    matchedDomain: match?.domain ?? null,
    matchedDomainType: match?.domainType ?? null,
  });
}

