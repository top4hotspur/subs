import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createSiteCustomerSessionToken,
  setSiteCustomerSessionCookie,
} from "@/lib/auth/site-customer-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { customerAccountLoginSchema } from "@/lib/sites/customer-site-customer-schema";
import { authenticateCustomerSiteCustomer } from "@/lib/sites/customer-site-customer-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function safeCallbackUrl(value: string | undefined, siteSlug: string): string {
  if (value?.startsWith("/account")) return value;
  if (!value || !value.startsWith(`/sites/${siteSlug}/account`)) {
    return `/sites/${encodeURIComponent(siteSlug)}/account`;
  }
  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) {
    return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
  }
  try {
    const { siteSlug } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const parsed = customerAccountLoginSchema.parse(await request.json());
    const customer = await authenticateCustomerSiteCustomer(site.id, parsed);
    if (!customer) return NextResponse.json({ ok: false, error: "INVALID_CUSTOMER_ACCESS" }, { status: 401 });
    const token = createSiteCustomerSessionToken({
      tenantSiteId: site.id,
      tenantSlug: site.slug,
      customerId: customer.id,
      email: customer.email,
    });
    const response = NextResponse.json({
      ok: true,
      customer,
      redirectUrl: safeCallbackUrl(parsed.callbackUrl, site.slug),
    });
    setSiteCustomerSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_LOGIN_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
