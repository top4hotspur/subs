import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSiteCustomerSessionContext } from "@/lib/auth/site-customer-session";
import { customerMarketingPreferenceSchema } from "@/lib/sites/customer-site-customer-schema";
import {
  getCustomerSiteCustomerById,
  updateCustomerSiteCustomerMarketingPreference,
} from "@/lib/sites/customer-site-customer-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await context.params;
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
  const session = await getSiteCustomerSessionContext();
  if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return NextResponse.json({ ok: true, customer: null });
  }
  const customer = await getCustomerSiteCustomerById(site.id, session.customerId);
  return NextResponse.json({ ok: true, customer });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  try {
    const { siteSlug } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const session = await getSiteCustomerSessionContext();
    if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
      return NextResponse.json({ ok: false, error: "CUSTOMER_SESSION_REQUIRED" }, { status: 401 });
    }
    const parsed = customerMarketingPreferenceSchema.parse(await request.json());
    const customer = await updateCustomerSiteCustomerMarketingPreference(
      site.id,
      session.customerId,
      parsed.marketingOptIn,
    );
    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_MARKETING_PREFERENCE_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
