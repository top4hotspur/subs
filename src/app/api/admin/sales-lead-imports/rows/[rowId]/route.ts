import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  markSalesLeadImportRowForEmailResearch,
  updateSalesLeadImportRow,
} from "@/lib/sales/sales-lead-import-repository";
import { updateSalesLeadImportRowSchema } from "@/lib/sales/sales-lead-import-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(request: Request, context: { params: Promise<{ rowId: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { rowId } = await context.params;
    const body = await request.json();
    const parsed = updateSalesLeadImportRowSchema.parse({ ...body, id: rowId });
    const row = await updateSalesLeadImportRow(parsed);
    return NextResponse.json({ ok: true, row });
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
        error: "SALES_LEAD_IMPORT_ROW_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ rowId: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { rowId } = await context.params;
    const body = await request.json();
    if (body?.action !== "MARK_EMAIL_RESEARCH") {
      return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
    }
    const row = await markSalesLeadImportRowForEmailResearch(rowId);
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SALES_LEAD_IMPORT_ROW_ACTION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
