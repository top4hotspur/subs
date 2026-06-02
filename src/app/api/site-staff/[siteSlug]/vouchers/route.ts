import { NextRequest, NextResponse } from "next/server";
import { getSiteStaffSessionContext } from "@/lib/auth/site-staff-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { voucherCodeLookupSchema } from "@/lib/sites/customer-site-voucher-schema";
import { getGiftVoucherByCode, voucherStaffSummary } from "@/lib/sites/customer-site-voucher-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveStaffTenant(siteSlug: string) {
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  const session = await getSiteStaffSessionContext();
  if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  const staff = await prisma.customerSiteStaffMember.findFirst({
    where: { id: session.staffMemberId, tenantSiteId: site.id, active: true, staffAccessEnabled: true },
    select: { id: true },
  });
  if (!staff) return { error: "FORBIDDEN", status: 403 as const };
  return { tenantSiteId: site.id };
}

export async function GET(request: NextRequest, context: { params: Promise<{ siteSlug: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveStaffTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const parsed = voucherCodeLookupSchema.safeParse({ code: request.nextUrl.searchParams.get("code") ?? "" });
    if (!parsed.success) return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.issues }, { status: 400 });
    const voucher = await getGiftVoucherByCode(resolved.tenantSiteId, parsed.data.code);
    if (!voucher) return NextResponse.json({ ok: false, error: "VOUCHER_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, voucher: voucherStaffSummary(voucher) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "SITE_STAFF_VOUCHER_LOOKUP_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
