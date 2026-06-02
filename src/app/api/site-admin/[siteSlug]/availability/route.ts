import { NextRequest, NextResponse } from "next/server";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import { calculateCustomerSiteAvailability } from "@/lib/sites/customer-site-availability";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveSiteAdminTenantBySlug(siteSlug);
    if (!resolved.ok) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const serviceId = request.nextUrl.searchParams.get("serviceId") ?? "";
    const staffId = request.nextUrl.searchParams.get("staffId") || null;
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const excludeBookingId = request.nextUrl.searchParams.get("excludeBookingId") || null;

    if (!serviceId || !date) {
      return NextResponse.json(
        { ok: false, error: "MISSING_AVAILABILITY_PARAMS" },
        { status: 400 },
      );
    }

    const availability = await calculateCustomerSiteAvailability({
      siteSlug,
      serviceId,
      staffId,
      date,
      excludeBookingId,
      includeDebug: true,
    });

    if (availability.tenantSiteId && availability.tenantSiteId !== resolved.tenantSiteId) {
      return NextResponse.json({ ok: false, error: "SITE_ADMIN_TENANT_MISMATCH" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_AVAILABILITY_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
