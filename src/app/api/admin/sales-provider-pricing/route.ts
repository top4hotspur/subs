import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSalesProviderPricing,
  listSalesProviderPricing,
  updateSalesProviderPricing,
} from "@/lib/sales/sales-provider-pricing-repository";
import {
  createSalesProviderPricingSchema,
  updateSalesProviderPricingSchema,
} from "@/lib/sales/sales-provider-pricing-schema";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function GET() {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const providers = await listSalesProviderPricing();
    return NextResponse.json({ ok: true, providers });
  } catch {
    return NextResponse.json({ ok: false, error: "SALES_PROVIDER_LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const body = await request.json();
    if (body?.id) {
      const parsed = updateSalesProviderPricingSchema.parse(body);
      const provider = await updateSalesProviderPricing(parsed);
      return NextResponse.json({ ok: true, provider });
    }

    const parsed = createSalesProviderPricingSchema.parse(body);
    const provider = await createSalesProviderPricing(parsed);
    return NextResponse.json({ ok: true, provider }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "SALES_PROVIDER_SAVE_FAILED" }, { status: 500 });
  }
}
