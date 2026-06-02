import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createSiteCustomerSessionToken,
  setSiteCustomerSessionCookie,
} from "@/lib/auth/site-customer-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { customerAccountRegisterSchema } from "@/lib/sites/customer-site-customer-schema";
import { registerCustomerSiteCustomer } from "@/lib/sites/customer-site-customer-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

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
    const parsed = customerAccountRegisterSchema.parse(await request.json());
    const customer = await registerCustomerSiteCustomer(site.id, parsed);
    const token = createSiteCustomerSessionToken({
      tenantSiteId: site.id,
      tenantSlug: site.slug,
      customerId: customer.id,
      email: customer.email,
    });
    const response = NextResponse.json({ ok: true, customer, redirectUrl: `/sites/${encodeURIComponent(site.slug)}/account` }, { status: 201 });
    setSiteCustomerSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "CUSTOMER_ACCOUNT_EXISTS") {
      return NextResponse.json({ ok: false, error: "CUSTOMER_ACCOUNT_NOT_CREATED" }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_REGISTER_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
