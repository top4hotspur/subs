import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  listCustomerSiteServices,
  replaceCustomerSiteServices,
  upsertCustomerSiteService,
} from "@/lib/sites/customer-site-settings-repository";
import {
  customerSiteServiceInputSchema,
  replaceCustomerSiteServicesSchema,
} from "@/lib/sites/customer-site-settings-schema";
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

    const services = await listCustomerSiteServices(id);
    return NextResponse.json({ ok: true, services });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_SERVICES_LIST_FAILED",
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
    const parsed = replaceCustomerSiteServicesSchema.parse({
      tenantSiteId: id,
      services: body?.services,
    });

    const services = await replaceCustomerSiteServices(id, parsed.services);
    return NextResponse.json({ ok: true, services });
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
        error: "SITE_SERVICES_REPLACE_FAILED",
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
    const service = customerSiteServiceInputSchema.parse(body);
    const saved = await upsertCustomerSiteService(id, service);
    return NextResponse.json({ ok: true, service: saved }, { status: 201 });
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
        error: "SITE_SERVICE_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
