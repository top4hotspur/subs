import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  listSalesCampaignTemplates,
  upsertSalesCampaignTemplate,
} from "@/lib/sales/sales-campaign-template-repository";
import { upsertSalesCampaignTemplateSchema } from "@/lib/sales/sales-campaign-template-schema";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function GET() {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const templates = await listSalesCampaignTemplates();
    return NextResponse.json({ ok: true, templates });
  } catch {
    return NextResponse.json({ ok: false, error: "SALES_CAMPAIGN_TEMPLATES_LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = upsertSalesCampaignTemplateSchema.parse(body);
    const template = await upsertSalesCampaignTemplate(parsed);
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "SALES_CAMPAIGN_TEMPLATE_SAVE_FAILED" }, { status: 500 });
  }
}
