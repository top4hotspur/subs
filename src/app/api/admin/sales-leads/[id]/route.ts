import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSalesLeadEvent,
  getSalesLeadById,
  markSalesLeadContacted,
  updateSalesLead,
} from "@/lib/sales/sales-lead-repository";
import { markSalesLeadContactedSchema, updateSalesLeadSchema } from "@/lib/sales/sales-lead-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await context.params;
  const lead = await getSalesLeadById(id);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "SALES_LEAD_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, lead });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body?.action === "MARK_CONTACTED") {
      const markInput = markSalesLeadContactedSchema.parse({
        id,
        message: body?.message,
        status: body?.status,
      });
      const lead = await markSalesLeadContacted(markInput);
      return NextResponse.json({ ok: true, lead });
    }

    const parsed = updateSalesLeadSchema.parse({
      id,
      businessName: body?.businessName,
      location: body?.location,
      industrySlug: body?.industrySlug,
      industryLabel: body?.industryLabel,
      contactName: body?.contactName,
      email: body?.email,
      phone: body?.phone,
      status: body?.status,
      source: body?.source,
      notes: body?.notes,
      lastContactedAt: body?.lastContactedAt,
      nextFollowUpAt: body?.nextFollowUpAt,
    });

    const lead = await updateSalesLead(parsed);
    await createSalesLeadEvent({
      salesLeadId: id,
      eventType: "ADMIN_PATCH",
      message: "Lead updated from admin sales page.",
      metadata: { status: lead.status },
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Sales lead not found") {
      return NextResponse.json({ ok: false, error: "SALES_LEAD_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "SALES_LEAD_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
