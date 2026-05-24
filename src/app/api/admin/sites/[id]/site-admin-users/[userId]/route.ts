import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { updateCustomerSiteAdminUser } from "@/lib/sites/customer-site-admin-user-repository";
import { updateCustomerSiteAdminUserSchema } from "@/lib/sites/customer-site-admin-user-schema";
import { getTenantSiteById } from "@/lib/sites/site-provisioning-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id, userId } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCustomerSiteAdminUserSchema.parse({
      tenantSiteId: id,
      id: userId,
      displayName: body?.displayName,
      role: body?.role,
      active: body?.active,
      invitationStatus: body?.invitationStatus,
      accessCode: body?.accessCode,
    });

    const user = await updateCustomerSiteAdminUser(parsed);
    if (!user) {
      return NextResponse.json({ ok: false, error: "SITE_ADMIN_USER_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user });
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
        error: "SITE_ADMIN_USER_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

