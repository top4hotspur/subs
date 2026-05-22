import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasPlatformAdminAccess } from "@/lib/admin/temp-admin-guard";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSiteStatusEvent,
  getTenantSiteById,
  listProvisioningTasks,
  listSiteDomains,
  updateTenantSiteProvisioningStatus,
} from "@/lib/sites/site-provisioning-repository";
import { updateTenantSiteStatusSchema } from "@/lib/sites/site-provisioning-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!hasPlatformAdminAccess(request)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }
    const domains = await listSiteDomains(id);
    const tasks = await listProvisioningTasks(id);
    return NextResponse.json({
      ok: true,
      site,
      domains,
      tasks,
      statusEvents: site.statusEvents,
      subscription: site.subscriptions[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_DETAIL_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!hasPlatformAdminAccess(request)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTenantSiteStatusSchema.parse({
      tenantSiteId: id,
      status: body?.status,
      provisioningStatus: body?.provisioningStatus,
      subscriptionStatus: body?.subscriptionStatus,
      domainStatus: body?.domainStatus,
      domainPrimary: body?.domainPrimary,
      whatsappAddonEnabled: body?.whatsappAddonEnabled,
    });

    const site = await updateTenantSiteProvisioningStatus(parsed);
    await createSiteStatusEvent({
      tenantSiteId: id,
      eventType: "SITE_STATUS_UPDATED",
      message: "Site status fields updated by admin.",
      metadata: {
        status: parsed.status,
        provisioningStatus: parsed.provisioningStatus,
        subscriptionStatus: parsed.subscriptionStatus,
        domainStatus: parsed.domainStatus,
      },
    });
    return NextResponse.json({ ok: true, site });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
