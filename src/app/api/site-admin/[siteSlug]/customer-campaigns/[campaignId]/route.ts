import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { isEmailConfigured } from "@/lib/email/email-provider";
import {
  CUSTOMER_CAMPAIGN_AUDIENCES,
  CUSTOMER_CAMPAIGN_TYPES,
  listCustomerMarketingCampaigns,
  sendCustomerMarketingCampaign,
  updateCustomerMarketingCampaign,
} from "@/lib/sites/customer-marketing-campaigns";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

const updateSchema = z.object({
  action: z.literal("UPDATE"),
  title: z.string().trim().min(2).max(160).optional(),
  subject: z.string().trim().min(2).max(200).optional(),
  body: z.string().trim().min(10).max(6000).optional(),
  campaignType: z.enum(CUSTOMER_CAMPAIGN_TYPES).optional(),
  audienceType: z.enum(CUSTOMER_CAMPAIGN_AUDIENCES).optional(),
  ctaLabel: z.string().trim().max(80).nullable().optional(),
  ctaUrl: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["DRAFT", "READY", "CANCELLED"]).optional(),
});

const sendSchema = z.object({
  action: z.literal("SEND"),
  selectedCustomerIds: z.array(z.string().trim().min(1)).max(500).optional(),
});

const bodySchema = z.discriminatedUnion("action", [updateSchema, sendSchema]);

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ siteSlug: string; campaignId: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug, campaignId } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }
    const parsed = bodySchema.parse(await request.json());
    if (parsed.action === "SEND") {
      const sendResult = await sendCustomerMarketingCampaign({
        tenantSiteId: resolved.tenantSiteId,
        siteSlug: resolved.siteSlug,
        campaignId,
        selectedCustomerIds: parsed.selectedCustomerIds ?? [],
      });
      const campaigns = await listCustomerMarketingCampaigns(resolved.tenantSiteId);
      return NextResponse.json({
        ok: sendResult.ok,
        error: sendResult.error,
        sendResult,
        campaigns,
        emailConfigured: isEmailConfigured(),
      }, { status: sendResult.ok ? 200 : 400 });
    }

    const updated = await updateCustomerMarketingCampaign(resolved.tenantSiteId, campaignId, parsed);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "CAMPAIGN_NOT_FOUND" }, { status: 404 });
    }
    const campaigns = await listCustomerMarketingCampaigns(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, campaign: { id: updated.id }, campaigns, emailConfigured: isEmailConfigured() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_CAMPAIGN_UPDATE_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
