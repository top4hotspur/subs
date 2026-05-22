import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import {
  createSetupRequest,
  listSetupRequests,
} from "@/lib/setup/setup-request-repository";
import {
  createSetupRequestSchema,
  listSetupRequestsSchema,
} from "@/lib/setup/setup-request-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  try {
    const body = await request.json();
    const input = createSetupRequestSchema.parse(body);
    const setupRequest = await createSetupRequest(input);
    return NextResponse.json({ ok: true, setupRequest }, { status: 201 });
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
        error: "SETUP_REQUEST_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const search = request.nextUrl.searchParams;
    const parsed = listSetupRequestsSchema.parse({
      tenantSiteId: search.get("tenantSiteId") ?? undefined,
      industrySlug: search.get("industrySlug") ?? undefined,
      status: search.get("status") ?? undefined,
      contactEmail: search.get("contactEmail") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
      skip: search.get("skip") ? Number(search.get("skip")) : undefined,
    });

    const setupRequests = await listSetupRequests(parsed);
    return NextResponse.json({ ok: true, setupRequests });
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
        error: "SETUP_REQUEST_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
