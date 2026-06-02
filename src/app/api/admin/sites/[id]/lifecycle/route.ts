import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { applyTenantSiteLifecycleAction } from "@/lib/sites/site-lifecycle-repository";
import { SITE_LIFECYCLE_ACTIONS } from "@/lib/sites/site-lifecycle";

const cuid = z.string().cuid();
const actionSchema = z.object({
  action: z.enum(SITE_LIFECYCLE_ACTIONS),
});

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const tenantSiteId = cuid.parse(id);
    const body = await request.json();
    const parsed = actionSchema.parse(body);
    const site = await applyTenantSiteLifecycleAction(tenantSiteId, parsed.action);
    return NextResponse.json({ ok: true, site, action: parsed.action });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SITE_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_LIFECYCLE_ACTION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
