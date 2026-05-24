import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getCustomerSiteSchedulingSnapshot,
  replaceCustomerSiteSchedulingSnapshot,
} from "@/lib/sites/customer-site-scheduling-repository";
import { schedulingSnapshotInputSchema } from "@/lib/sites/customer-site-scheduling-schema";
import { getTenantSiteById } from "@/lib/sites/site-provisioning-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const scheduling = await getCustomerSiteSchedulingSnapshot(id);
    return NextResponse.json({ ok: true, scheduling });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SCHEDULING_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = schedulingSnapshotInputSchema.parse({
      tenantSiteId: id,
      rotaDays: body?.rotaDays,
      breakWindows: body?.breakWindows,
      businessClosures: body?.businessClosures,
      staffHolidays: body?.staffHolidays,
    });

    const scheduling = await replaceCustomerSiteSchedulingSnapshot(id, {
      rotaDays: parsed.rotaDays,
      breakWindows: parsed.breakWindows,
      businessClosures: parsed.businessClosures,
      staffHolidays: parsed.staffHolidays,
    });

    return NextResponse.json({ ok: true, scheduling });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Invalid staff member") ? 400 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: "SCHEDULING_SAVE_FAILED",
        message,
      },
      { status },
    );
  }
}
