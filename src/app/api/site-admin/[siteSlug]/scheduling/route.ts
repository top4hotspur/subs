import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import {
  getCustomerSiteSchedulingSnapshot,
  replaceCustomerSiteSchedulingSnapshot,
} from "@/lib/sites/customer-site-scheduling-repository";
import { schedulingSnapshotInputSchema } from "@/lib/sites/customer-site-scheduling-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveSiteAdminTenantBySlug(siteSlug);
    if (!resolved.ok) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }
    const scheduling = await getCustomerSiteSchedulingSnapshot(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, scheduling });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_SCHEDULING_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const parsed = schedulingSnapshotInputSchema.parse({
      tenantSiteId: resolved.tenantSiteId,
      rotaDays: body?.rotaDays,
      breakWindows: body?.breakWindows,
      businessClosures: body?.businessClosures,
      staffHolidays: body?.staffHolidays,
    });
    const scheduling = await replaceCustomerSiteSchedulingSnapshot(resolved.tenantSiteId, parsed);
    return NextResponse.json({ ok: true, scheduling });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && /rota|break|working|time/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: [{ message: error.message }] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_SCHEDULING_SAVE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
