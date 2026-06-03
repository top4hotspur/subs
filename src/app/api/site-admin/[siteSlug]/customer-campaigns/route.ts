import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { isEmailConfigured } from "@/lib/email/email-provider";
import {
  createCustomerMarketingCampaign,
  CUSTOMER_CAMPAIGN_AUDIENCES,
  CUSTOMER_CAMPAIGN_TYPES,
  listCustomerMarketingCampaigns,
} from "@/lib/sites/customer-marketing-campaigns";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

const campaignSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(10).max(6000),
  campaignType: z.enum(CUSTOMER_CAMPAIGN_TYPES),
  audienceType: z.enum(CUSTOMER_CAMPAIGN_AUDIENCES),
  ctaLabel: z.string().trim().max(80).nullable().optional(),
  ctaUrl: z.string().trim().max(500).nullable().optional(),
});

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  return { tenantSiteId: site.id, siteSlug: site.slug };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }
    const campaigns = await listCustomerMarketingCampaigns(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, campaigns, emailConfigured: isEmailConfigured() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_CAMPAIGNS_GET_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }
    const parsed = campaignSchema.parse(await request.json());
    const campaign = await createCustomerMarketingCampaign(resolved.tenantSiteId, parsed);
    const campaigns = await listCustomerMarketingCampaigns(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, campaign: { id: campaign.id }, campaigns, emailConfigured: isEmailConfigured() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_CAMPAIGN_CREATE_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
