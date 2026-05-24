import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createCustomerSiteAdminUser,
  listCustomerSiteAdminUsers,
} from "@/lib/sites/customer-site-admin-user-repository";
import { createCustomerSiteAdminUserSchema } from "@/lib/sites/customer-site-admin-user-schema";
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
    const users = await listCustomerSiteAdminUsers(id);
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_USERS_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const parsed = createCustomerSiteAdminUserSchema.parse({
      tenantSiteId: id,
      email: body?.email,
      displayName: body?.displayName ?? null,
      role: body?.role ?? "OWNER",
      active: body?.active ?? true,
      invitationStatus: body?.invitationStatus ?? "INVITED",
      accessCode: body?.accessCode,
    });

    const created = await createCustomerSiteAdminUser(parsed);
    return NextResponse.json({
      ok: true,
      user: created.user,
      generatedAccessCode: created.generatedAccessCode,
    });
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
        error: "SITE_ADMIN_USER_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

