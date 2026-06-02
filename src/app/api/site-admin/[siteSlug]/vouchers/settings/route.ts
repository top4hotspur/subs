import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { saveGiftVoucherSettingsSchema } from "@/lib/sites/customer-site-voucher-schema";
import { saveVoucherSettings } from "@/lib/sites/customer-site-voucher-repository";
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

export async function PUT(request: NextRequest, context: { params: Promise<{ siteSlug: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const parsed = saveGiftVoucherSettingsSchema.parse(await request.json());
    const settings = await saveVoucherSettings(resolved.tenantSiteId, parsed);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    return NextResponse.json({ ok: false, error: "SITE_ADMIN_VOUCHER_SETTINGS_SAVE_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
