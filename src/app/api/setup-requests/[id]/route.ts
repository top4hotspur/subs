import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import {
  getSetupRequestById,
  getSetupRequestByIdForConfirmation,
  updateSetupRequestStatus,
} from "@/lib/setup/setup-request-repository";
import { updateSetupRequestStatusSchema } from "@/lib/setup/setup-request-schema";

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
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  try {
    const { id } = await context.params;
    const isAdmin = await isPlatformAdminSession();
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const setupRequest = isAdmin
      ? await getSetupRequestById(id)
      : await getSetupRequestByIdForConfirmation(id, token);

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

  if (!(await isPlatformAdminSession())) {
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
