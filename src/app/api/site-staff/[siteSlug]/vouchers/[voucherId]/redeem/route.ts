import { NextResponse } from "next/server";
import { getSiteStaffSessionContext } from "@/lib/auth/site-staff-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { normalizeStaffPermissions } from "@/lib/sites/customer-site-staff-repository";
import { runGiftVoucherAdminAction, voucherStaffSummary } from "@/lib/sites/customer-site-voucher-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function POST(_request: Request, context: { params: Promise<{ siteSlug: string; voucherId: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug, voucherId } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const session = await getSiteStaffSessionContext();
    if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const staff = await prisma.customerSiteStaffMember.findFirst({
      where: { id: session.staffMemberId, tenantSiteId: site.id, active: true, staffAccessEnabled: true },
      select: { id: true, isSuperUser: true, staffPermissions: true },
    });
    if (!staff) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    const permissions = normalizeStaffPermissions(staff.staffPermissions, staff.isSuperUser);
    if (!permissions.redeemVouchers) {
      return NextResponse.json({ ok: false, error: "STAFF_PERMISSION_DENIED" }, { status: 403 });
    }
    const result = await runGiftVoucherAdminAction(site.id, voucherId, "MARK_REDEEMED", staff.id);
    return NextResponse.json({ ok: true, voucher: voucherStaffSummary(result.voucher) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "SITE_STAFF_VOUCHER_REDEEM_FAILED" }, { status: 400 });
  }
}
