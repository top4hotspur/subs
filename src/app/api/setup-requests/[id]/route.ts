import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getSetupRequestById,
  updateSetupRequestStatus,
} from "@/lib/setup/setup-request-repository";
import { updateSetupRequestStatusSchema } from "@/lib/setup/setup-request-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

function parsePlatformAdminEmails(): string[] {
  const raw = getOptionalServerEnv("PLATFORM_ADMIN_EMAILS");
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function hasAdminAccess(request: NextRequest): boolean {
  // Temporary guard until Auth.js is introduced.
  // Uses x-platform-admin-email header only for local/dev smoke testing.
  const headerEmail = request.headers
    .get("x-platform-admin-email")
    ?.trim()
    .toLowerCase();

  if (!headerEmail) {
    return false;
  }

  const allowlist = parsePlatformAdminEmails();
  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.includes(headerEmail);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  // Temporary: public read by opaque id for confirmation flow.
  // Future hardening should require a signed token or authenticated owner access.
  try {
    const { id } = await context.params;
    const setupRequest = await getSetupRequestById(id);

    if (!setupRequest) {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, setupRequest });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_READ_FAILED",
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
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  if (!hasAdminAccess(request)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const input = updateSetupRequestStatusSchema.parse({
      setupRequestId: id,
      status: body?.status,
      message: body?.message,
      metadata: body?.metadata,
    });

    const setupRequest = await updateSetupRequestStatus(input);
    return NextResponse.json({ ok: true, setupRequest });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Setup request not found") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_STATUS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
