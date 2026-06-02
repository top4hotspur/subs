import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { voucherActionSchema } from "@/lib/sites/customer-site-voucher-schema";
import { runGiftVoucherAdminAction } from "@/lib/sites/customer-site-voucher-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) return { error: "FORBIDDEN", status: 403 as const };
  return { tenantSiteId: site.id };
}

export async function POST(request: NextRequest, context: { params: Promise<{ siteSlug: string; voucherId: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug, voucherId } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const parsed = voucherActionSchema.parse(await request.json());
    const result = await runGiftVoucherAdminAction(resolved.tenantSiteId, voucherId, parsed.action);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "SITE_ADMIN_VOUCHER_ACTION_FAILED" }, { status: 400 });
  }
}
