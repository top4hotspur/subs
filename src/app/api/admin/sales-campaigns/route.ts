import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSalesCampaign,
  listSalesCampaigns,
} from "@/lib/sales/sales-campaign-repository";
import {
  createSalesCampaignSchema,
  listSalesCampaignsSchema,
} from "@/lib/sales/sales-campaign-schema";

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
    const parsed = listSalesCampaignsSchema.parse({
      industrySlug: search.get("industrySlug") ?? undefined,
      serviceArea: search.get("serviceArea") ?? undefined,
      campaignLevel: search.get("campaignLevel") ?? undefined,
      status: search.get("status") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
    });
    const campaigns = await listSalesCampaigns(parsed);
    return NextResponse.json({ ok: true, campaigns });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "SALES_CAMPAIGN_LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = createSalesCampaignSchema.parse(body);
    const campaign = await createSalesCampaign(parsed);
    return NextResponse.json({ ok: true, campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "SALES_CAMPAIGN_CREATE_FAILED" }, { status: 500 });
  }
}
