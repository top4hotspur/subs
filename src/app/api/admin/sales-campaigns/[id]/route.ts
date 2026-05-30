import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { updateSalesCampaign } from "@/lib/sales/sales-campaign-repository";
import { updateSalesCampaignSchema } from "@/lib/sales/sales-campaign-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSalesCampaignSchema.parse({
      id,
      name: body?.name,
      industrySlug: body?.industrySlug,
      serviceArea: body?.serviceArea,
      campaignLevel: body?.campaignLevel,
      status: body?.status,
    });
    const campaign = await updateSalesCampaign(parsed);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "SALES_CAMPAIGN_UPDATE_FAILED" }, { status: 500 });
  }
}
