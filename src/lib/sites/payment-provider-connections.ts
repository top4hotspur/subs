import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export const PAYMENT_PROVIDER_KEYS = ["STRIPE", "SQUARE", "PAYPAL", "SUMUP", "ZETTLE", "WORLDPAY", "OTHER"] as const;
export type PaymentProviderKey = (typeof PAYMENT_PROVIDER_KEYS)[number];

export type PaymentProviderConnectionRecord = {
  id: string;
  tenantSiteId: string;
  provider: PaymentProviderKey;
  connectionMode: string;
  environment: string;
  providerAccountId: string | null;
  providerAccountName: string | null;
  providerAccountEmail: string | null;
  publicEnabled: boolean;
  connectionStatus: string;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastVerifiedAt: string | null;
  setupNotes: string | null;
  secureSecretRef: string | null;
  createdAt: string;
  updatedAt: string;
};

const SECRET = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "subs-dev-payment-connect";

export function normalizePaymentProviderKey(value: string | null | undefined): PaymentProviderKey {
  const normalized = (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "STRIPE") return "STRIPE";
  if (normalized === "SQUARE") return "SQUARE";
  if (normalized === "PAYPAL" || normalized === "PAY_PAL") return "PAYPAL";
  if (normalized === "SUMUP" || normalized === "SUM_UP") return "SUMUP";
  if (normalized === "ZETTLE") return "ZETTLE";
  if (normalized === "WORLDPAY" || normalized === "WORLD_PAY") return "WORLDPAY";
  return "OTHER";
}

export function displayPaymentProvider(provider: string | null | undefined): string {
  switch (normalizePaymentProviderKey(provider)) {
    case "STRIPE":
      return "Stripe";
    case "SQUARE":
      return "Square";
    case "PAYPAL":
      return "PayPal";
    case "SUMUP":
      return "SumUp";
    case "ZETTLE":
      return "Zettle";
    case "WORLDPAY":
      return "Worldpay";
    default:
      return "Other";
  }
}

function toRecord(record: {
  id: string;
  tenantSiteId: string;
  provider: string;
  connectionMode: string;
  environment: string;
  providerAccountId: string | null;
  providerAccountName: string | null;
  providerAccountEmail: string | null;
  publicEnabled: boolean;
  connectionStatus: string;
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  lastVerifiedAt: Date | null;
  setupNotes: string | null;
  secureSecretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentProviderConnectionRecord {
  return {
    id: record.id,
    tenantSiteId: record.tenantSiteId,
    provider: normalizePaymentProviderKey(record.provider),
    connectionMode: record.connectionMode,
    environment: record.environment,
    providerAccountId: record.providerAccountId,
    providerAccountName: record.providerAccountName,
    providerAccountEmail: record.providerAccountEmail,
    publicEnabled: record.publicEnabled,
    connectionStatus: record.connectionStatus,
    connectedAt: record.connectedAt?.toISOString() ?? null,
    disconnectedAt: record.disconnectedAt?.toISOString() ?? null,
    lastVerifiedAt: record.lastVerifiedAt?.toISOString() ?? null,
    setupNotes: record.setupNotes,
    secureSecretRef: record.secureSecretRef,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listPaymentProviderConnections(tenantSiteId: string): Promise<PaymentProviderConnectionRecord[]> {
  const rows = await prisma.customerSitePaymentProviderConnection.findMany({
    where: { tenantSiteId },
    orderBy: [{ provider: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toRecord);
}

export async function getPaymentProviderConnection(
  tenantSiteId: string,
  provider: string,
): Promise<PaymentProviderConnectionRecord | null> {
  const row = await prisma.customerSitePaymentProviderConnection.findUnique({
    where: {
      tenantSiteId_provider: {
        tenantSiteId,
        provider: normalizePaymentProviderKey(provider),
      },
    },
  });
  return row ? toRecord(row) : null;
}

export async function upsertPaymentProviderConnection(input: {
  tenantSiteId: string;
  provider: string;
  connectionMode?: string;
  environment?: string;
  providerAccountId?: string | null;
  providerAccountName?: string | null;
  providerAccountEmail?: string | null;
  publicEnabled?: boolean;
  connectionStatus?: string;
  setupNotes?: string | null;
  secureSecretRef?: string | null;
}): Promise<PaymentProviderConnectionRecord> {
  const provider = normalizePaymentProviderKey(input.provider);
  const row = await prisma.customerSitePaymentProviderConnection.upsert({
    where: { tenantSiteId_provider: { tenantSiteId: input.tenantSiteId, provider } },
    update: {
      ...(input.connectionMode ? { connectionMode: input.connectionMode } : {}),
      ...(input.environment ? { environment: input.environment } : {}),
      ...(input.providerAccountId !== undefined ? { providerAccountId: input.providerAccountId } : {}),
      ...(input.providerAccountName !== undefined ? { providerAccountName: input.providerAccountName } : {}),
      ...(input.providerAccountEmail !== undefined ? { providerAccountEmail: input.providerAccountEmail } : {}),
      ...(input.publicEnabled !== undefined ? { publicEnabled: input.publicEnabled } : {}),
      ...(input.connectionStatus ? { connectionStatus: input.connectionStatus } : {}),
      ...(input.setupNotes !== undefined ? { setupNotes: input.setupNotes } : {}),
      ...(input.secureSecretRef !== undefined ? { secureSecretRef: input.secureSecretRef } : {}),
      ...(input.connectionStatus === "CONNECTED" ? { connectedAt: new Date(), disconnectedAt: null, lastVerifiedAt: new Date() } : {}),
      ...(input.connectionStatus === "DISCONNECTED" ? { disconnectedAt: new Date(), publicEnabled: false } : {}),
    },
    create: {
      tenantSiteId: input.tenantSiteId,
      provider,
      connectionMode: input.connectionMode ?? "MANUAL_ONLY",
      environment: input.environment ?? "TEST",
      providerAccountId: input.providerAccountId ?? null,
      providerAccountName: input.providerAccountName ?? null,
      providerAccountEmail: input.providerAccountEmail ?? null,
      publicEnabled: input.publicEnabled ?? false,
      connectionStatus: input.connectionStatus ?? "NOT_STARTED",
      setupNotes: input.setupNotes ?? null,
      secureSecretRef: input.secureSecretRef ?? null,
      connectedAt: input.connectionStatus === "CONNECTED" ? new Date() : null,
      lastVerifiedAt: input.connectionStatus === "CONNECTED" ? new Date() : null,
    },
  });
  return toRecord(row);
}

export function hasConnectedProviderCheckout(input: {
  connection?: Pick<PaymentProviderConnectionRecord, "connectionStatus" | "connectionMode" | "publicEnabled"> | null;
  checkoutImplemented?: boolean;
}): boolean {
  return Boolean(
    input.checkoutImplemented &&
      input.connection?.publicEnabled &&
      input.connection.connectionStatus === "CONNECTED" &&
      input.connection.connectionMode === "OAUTH_CONNECTED",
  );
}

export function createPaymentConnectState(input: {
  tenantSiteId: string;
  siteSlug: string;
  siteAdminUserId: string;
  provider: PaymentProviderKey;
}): string {
  const payload = [
    input.tenantSiteId,
    input.siteSlug,
    input.siteAdminUserId,
    input.provider,
    Date.now().toString(),
  ].map(encodeURIComponent).join(".");
  const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPaymentConnectState(token: string): {
  tenantSiteId: string;
  siteSlug: string;
  siteAdminUserId: string;
  provider: PaymentProviderKey;
} | null {
  const parts = token.split(".");
  if (parts.length !== 6) return null;
  const payload = parts.slice(0, 5).join(".");
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const supplied = parts[5] ?? "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return null;
  const [tenantSiteId, siteSlug, siteAdminUserId, provider] = parts.slice(0, 4).map(decodeURIComponent);
  return {
    tenantSiteId,
    siteSlug,
    siteAdminUserId,
    provider: normalizePaymentProviderKey(provider),
  };
}

export function getStripeConnectClientId(): string | undefined {
  return getOptionalServerEnv("STRIPE_CONNECT_CLIENT_ID");
}

export function getSquareOAuthConfig(): { applicationId?: string; redirectUrl?: string } {
  return {
    applicationId: getOptionalServerEnv("SQUARE_APPLICATION_ID"),
    redirectUrl: getOptionalServerEnv("SQUARE_OAUTH_REDIRECT_URL"),
  };
}
