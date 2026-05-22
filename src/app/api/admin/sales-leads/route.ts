import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { createSalesLead, listSalesLeads } from "@/lib/sales/sales-lead-repository";
import { createSalesLeadSchema, listSalesLeadsSchema } from "@/lib/sales/sales-lead-schema";

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
    const parsed = listSalesLeadsSchema.parse({
      search: search.get("search") ?? undefined,
      status: search.get("status") ?? undefined,
      industrySlug: search.get("industrySlug") ?? undefined,
      location: search.get("location") ?? undefined,
      country: search.get("country") ?? undefined,
      cityTown: search.get("cityTown") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
      skip: search.get("skip") ? Number(search.get("skip")) : undefined,
    });

    const leads = await listSalesLeads(parsed);
    return NextResponse.json({ ok: true, leads });
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
        error: "SALES_LEAD_LIST_FAILED",
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
    const parsed = createSalesLeadSchema.parse(body);
    const lead = await createSalesLead(parsed);
    return NextResponse.json({ ok: true, lead }, { status: 201 });
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
        error: "SALES_LEAD_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
