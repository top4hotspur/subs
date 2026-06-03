import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { createSubscriberSiteFromSetupRequest } from "@/lib/sites/site-provisioning-service";

const cuid = z.string().cuid();

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const setupRequestId = cuid.parse(id);
    const result = await createSubscriberSiteFromSetupRequest(setupRequestId);

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (error instanceof Error && error.message === "SETUP_REQUEST_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_FOUND" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "SETUP_REQUEST_ARCHIVED") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_ARCHIVED" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SETUP_REQUEST_CANCELLED") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_CANCELLED" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SETUP_REQUEST_NOT_PAID") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_PAID" }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "CREATE_SUBSCRIBER_SITE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
