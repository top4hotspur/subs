import { NextResponse } from "next/server";
import { getSiteCustomerSessionContext } from "@/lib/auth/site-customer-session";
import { getCustomerSiteCustomerById } from "@/lib/sites/customer-site-customer-repository";
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
