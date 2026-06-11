import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSalesLeadImportBatch,
  listSalesLeadImportBatches,
} from "@/lib/sales/sales-lead-import-repository";
import { createSalesLeadImportBatchSchema } from "@/lib/sales/sales-lead-import-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET() {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const batches = await listSalesLeadImportBatches();
    return NextResponse.json({ ok: true, batches });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SALES_LEAD_IMPORT_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createSalesLeadImportBatchSchema.parse(body);
    const batch = await createSalesLeadImportBatch(parsed);
    return NextResponse.json({ ok: true, batch }, { status: 201 });
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
        error: "SALES_LEAD_IMPORT_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
