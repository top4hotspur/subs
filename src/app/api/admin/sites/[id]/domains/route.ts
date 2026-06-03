import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { createSiteDomain, getTenantSiteById, listSiteDomains } from "@/lib/sites/site-provisioning-repository";
import { createOrUpdateSiteDomainSchema } from "@/lib/sites/site-provisioning-schema";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const domains = await listSiteDomains(id);
    return NextResponse.json({ ok: true, domains });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "SITE_DOMAINS_GET_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const body = await request.json();
    const parsed = createOrUpdateSiteDomainSchema.parse({
      tenantSiteId: id,
      domain: body?.domain,
      domainType: body?.domainType ?? "PRIMARY",
      status: body?.status ?? "DOMAIN_PENDING",
      domainStatus: body?.domainStatus,
      domainSetupMode: body?.domainSetupMode,
      dnsStatus: body?.dnsStatus,
      sslStatus: body?.sslStatus,
      nameserverInstructionsSentAt: body?.nameserverInstructionsSentAt,
      dnsLastCheckedAt: body?.dnsLastCheckedAt,
      dnsVerifiedAt: body?.dnsVerifiedAt,
      goLiveRequestedAt: body?.goLiveRequestedAt,
      wentLiveAt: body?.wentLiveAt,
      domainNotes: body?.domainNotes,
      expectedDnsTarget: body?.expectedDnsTarget,
      expectedNameservers: body?.expectedNameservers,
      lastDnsCheckResult: body?.lastDnsCheckResult,
      registrarNotes: body?.registrarNotes,
      dnsInstructions: body?.dnsInstructions,
    });
    const domain = await createSiteDomain(parsed);
    const domains = await listSiteDomains(id);
    return NextResponse.json({ ok: true, domain, domains });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    if (error instanceof Error && (error.message === "SITE_DOMAIN_INVALID" || error.message === "SITE_DOMAIN_ALREADY_ASSIGNED")) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "SITE_DOMAIN_SAVE_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
