import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSalesLeadEvent,
  deleteSalesLead,
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

    if (body?.action === "MARK_CONTACTED" || body?.action === "MARK_EMAIL_SENT") {
      const markInput = markSalesLeadContactedSchema.parse({
        id,
        message: body?.message,
        status: body?.status ?? (body?.action === "MARK_EMAIL_SENT" ? "CONTACTED" : undefined),
      });
      const lead = await markSalesLeadContacted(markInput);
      if (body?.action === "MARK_EMAIL_SENT") {
        await createSalesLeadEvent({
          salesLeadId: id,
          eventType: "MARKETING_EMAIL_LOGGED",
          message: body?.message ?? "Marketing email marked as sent (preview/copy workflow).",
          metadata: { action: "MARK_EMAIL_SENT" },
        });
      }
      return NextResponse.json({ ok: true, lead });
    }

    const parsed = updateSalesLeadSchema.parse({
      id,
      businessName: body?.businessName,
      location: body?.location,
      country: body?.country,
      cityTown: body?.cityTown,
      postcode: body?.postcode,
      address: body?.address,
      serviceArea: body?.serviceArea,
      industrySlug: body?.industrySlug,
      industryLabel: body?.industryLabel,
      contactName: body?.contactName,
      contactFirstName: body?.contactFirstName,
      contactLastName: body?.contactLastName,
      email: body?.email,
      phone: body?.phone,
      leadSource: body?.leadSource,
      sourceUrl: body?.sourceUrl,
      currentProvider: body?.currentProvider,
      estimatedCurrentMonthlyCost: body?.estimatedCurrentMonthlyCost,
      marketingStatus: body?.marketingStatus,
      pipelineVisibility: body?.pipelineVisibility,
      unsubscribedAt: body?.unsubscribedAt,
      doNotContactReason: body?.doNotContactReason,
      status: body?.status,
      source: body?.source,
      notes: body?.notes,
      lastContactedAt: body?.lastContactedAt,
      lastMarketingEmailAt: body?.lastMarketingEmailAt,
      emailSentCount: body?.emailSentCount,
      nextFollowUpAt: body?.nextFollowUpAt,
      lastCampaignStep: body?.lastCampaignStep,
      snoozedUntil: body?.snoozedUntil,
      convertedAt: body?.convertedAt,
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const force = request.nextUrl.searchParams.get("force") === "true";
    const result = await deleteSalesLead({ id, force });
    return NextResponse.json({ ok: true, deletedLeadId: result.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Sales lead not found") {
      return NextResponse.json({ ok: false, error: "SALES_LEAD_NOT_FOUND" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Force confirmation required") {
      return NextResponse.json({ ok: false, error: "FORCE_CONFIRMATION_REQUIRED" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "SALES_LEAD_DELETE_FAILED" }, { status: 500 });
  }
}
