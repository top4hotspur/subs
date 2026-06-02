import { NextRequest, NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { getVoucherSettings, listGiftVouchers } from "@/lib/sites/customer-site-voucher-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  return { tenantSiteId: site.id };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ siteSlug: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const [settings, vouchers] = await Promise.all([
      getVoucherSettings(resolved.tenantSiteId),
      listGiftVouchers(resolved.tenantSiteId),
    ]);
    return NextResponse.json({ ok: true, settings, vouchers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "SITE_ADMIN_VOUCHERS_GET_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
