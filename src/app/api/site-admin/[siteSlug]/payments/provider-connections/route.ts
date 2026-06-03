import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  listPaymentProviderConnections,
  PAYMENT_PROVIDER_KEYS,
  upsertPaymentProviderConnection,
} from "@/lib/sites/payment-provider-connections";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

const connectionSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDER_KEYS),
  connectionMode: z.enum(["MANUAL_ONLY", "OAUTH_PENDING", "OAUTH_CONNECTED", "ASSISTED_SETUP", "DISCONNECTED"]).optional(),
  environment: z.enum(["TEST", "LIVE"]).optional(),
  providerAccountId: z.string().trim().max(200).nullable().optional(),
  providerAccountName: z.string().trim().max(200).nullable().optional(),
  providerAccountEmail: z.string().trim().email().max(200).nullable().optional(),
  publicEnabled: z.boolean().optional(),
  connectionStatus: z.enum(["NOT_STARTED", "PENDING", "CONNECTED", "NEEDS_ATTENTION", "DISCONNECTED"]).optional(),
  setupNotes: z.string().trim().max(1200).nullable().optional(),
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
  return { tenantSiteId: site.id };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const connections = await listPaymentProviderConnections(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, connections });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "PAYMENT_CONNECTIONS_GET_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    const parsed = connectionSchema.parse(await request.json());
    await upsertPaymentProviderConnection({
      tenantSiteId: resolved.tenantSiteId,
      ...parsed,
    });
    const connections = await listPaymentProviderConnections(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, connections });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "PAYMENT_CONNECTION_UPDATE_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
