import { NextRequest, NextResponse } from "next/server";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
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
    const serviceId = request.nextUrl.searchParams.get("serviceId") ?? "";
    const staffId = request.nextUrl.searchParams.get("staffId") || null;
    const date = request.nextUrl.searchParams.get("date") ?? "";

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
      includeDebug: false,
    });

    return NextResponse.json({
      ok: true,
      serviceId: availability.serviceId,
      staffId: availability.staffId,
      anyStaff: availability.anyStaff,
      date: availability.date,
      slots: availability.slots.map((slot) => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        staffMemberId: slot.staffMemberId,
        staffName: slot.staffName,
        serviceId: slot.serviceId,
      })),
      message: availability.setupIncomplete
        ? "Online booking times will appear here once this business finishes availability setup."
        : availability.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_AVAILABILITY_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
