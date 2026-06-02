import { NextResponse } from "next/server";
import { getSiteStaffSessionContext } from "@/lib/auth/site-staff-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getCustomerSiteBookingById,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { prisma } from "@/lib/db/prisma";
import { normalizeStaffPermissions } from "@/lib/sites/customer-site-staff-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

type CompleteBookingRouteContext = {
  params: Promise<{ siteSlug: string; bookingId: string }>;
};

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(_request: Request, context: CompleteBookingRouteContext) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug, bookingId } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const session = await getSiteStaffSessionContext();
    if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const staff = await prisma.customerSiteStaffMember.findFirst({
      where: {
        id: session.staffMemberId,
        tenantSiteId: site.id,
        active: true,
        staffAccessEnabled: true,
      },
      select: { isSuperUser: true, staffPermissions: true },
    });
    if (!staff) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const permissions = normalizeStaffPermissions(staff.staffPermissions, staff.isSuperUser);
    if (!permissions.markCompleted) {
      return NextResponse.json({ ok: false, error: "STAFF_PERMISSION_DENIED" }, { status: 403 });
    }

    const booking = await getCustomerSiteBookingById(site.id, bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "BOOKING_NOT_FOUND" }, { status: 404 });
    }
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED" || booking.status === "NO_SHOW") {
      return NextResponse.json(
        { ok: false, error: "BOOKING_UPDATE_NOT_ALLOWED" },
        { status: 400 },
      );
    }

    const updated = await updateCustomerSiteBookingStatus(site.id, {
      bookingId,
      status: "COMPLETED",
    });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_STAFF_BOOKING_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
