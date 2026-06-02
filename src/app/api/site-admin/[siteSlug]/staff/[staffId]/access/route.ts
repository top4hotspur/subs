import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  generateCustomerSiteStaffAccessCode,
  setCustomerSiteStaffAccessEnabled,
} from "@/lib/sites/customer-site-staff-repository";

type StaffAccessRouteContext = {
  params: Promise<{ siteSlug: string; staffId: string }>;
};

const staffAccessSchema = z.object({
  action: z.enum(["generate", "disable", "enable"]).default("generate"),
});

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(request: NextRequest, context: StaffAccessRouteContext) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug, staffId } = await context.params;
    const resolved = await resolveSiteAdminTenantBySlug(siteSlug);
    if (!resolved.ok) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = staffAccessSchema.parse(body ?? {});
    if (parsed.action === "generate") {
      const result = await generateCustomerSiteStaffAccessCode(resolved.tenantSiteId, staffId);
      return NextResponse.json({
        ok: true,
        staff: result.staff,
        accessCode: result.accessCode,
        staffLoginUrl: `/site-staff/${encodeURIComponent(siteSlug)}`,
      });
    }

    const staff = await setCustomerSiteStaffAccessEnabled(
      resolved.tenantSiteId,
      staffId,
      parsed.action === "enable",
    );
    return NextResponse.json({
      ok: true,
      staff,
      accessCode: null,
      staffLoginUrl: `/site-staff/${encodeURIComponent(siteSlug)}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "STAFF_MEMBER_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "STAFF_MEMBER_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_STAFF_ACCESS_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
