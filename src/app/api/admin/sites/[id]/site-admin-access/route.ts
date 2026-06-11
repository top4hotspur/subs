import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resetAndEmailTenantSiteAdminAccess } from "@/lib/sites/site-admin-access-handover";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
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
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    const bodyEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const result = await resetAndEmailTenantSiteAdminAccess({
      tenantSiteId: id,
      email: bodyEmail || null,
    });
    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error === "SITE_ADMIN_EMAIL_REQUIRED" ? 400 : 404 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_ACCESS_RESET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
