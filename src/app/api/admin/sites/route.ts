import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createTenantSiteFromSetupRequest,
  listTenantSites,
} from "@/lib/sites/site-provisioning-repository";
import {
  createTenantSiteFromSetupRequestSchema,
  listTenantSitesSchema,
} from "@/lib/sites/site-provisioning-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const search = request.nextUrl.searchParams;
    const parsed = listTenantSitesSchema.parse({
      industrySlug: search.get("industrySlug") ?? undefined,
      provisioningStatus: search.get("provisioningStatus") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
      skip: search.get("skip") ? Number(search.get("skip")) : undefined,
    });

    const sites = await listTenantSites(parsed);
    return NextResponse.json({ ok: true, sites });
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
        error: "SITE_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createTenantSiteFromSetupRequestSchema.parse({
      setupRequestId: body?.setupRequestId,
    });

    const result = await createTenantSiteFromSetupRequest(parsed);
    return NextResponse.json({ ok: true, ...result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Setup request not found") {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_CREATE_FROM_SETUP_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
