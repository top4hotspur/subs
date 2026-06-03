import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { siteDnsInstructionsCustomerEmail } from "@/lib/email/email-templates";
import { buildDnsInstructionsText } from "@/lib/sites/domain-go-live";
import { applyTenantSiteLifecycleAction } from "@/lib/sites/site-lifecycle-repository";

const cuid = z.string().cuid();
const sendDnsInstructionsSchema = z.object({
  siteDomainId: cuid.optional(),
});

type DnsInstructionMetadata = {
  targetInstructions?: string;
  lastEmailStatus?: string;
  lastEmailSentAt?: string;
  lastEmailError?: string | null;
  lastEmailRecipient?: string;
};

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

function absoluteAppUrl(path: string): string {
  const baseUrl = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}${path}` : path;
}

function metadataFromJson(value: Prisma.JsonValue | null): DnsInstructionMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    targetInstructions: typeof record.targetInstructions === "string" ? record.targetInstructions : undefined,
    lastEmailStatus: typeof record.lastEmailStatus === "string" ? record.lastEmailStatus : undefined,
    lastEmailSentAt: typeof record.lastEmailSentAt === "string" ? record.lastEmailSentAt : undefined,
    lastEmailError: typeof record.lastEmailError === "string" ? record.lastEmailError : null,
    lastEmailRecipient: typeof record.lastEmailRecipient === "string" ? record.lastEmailRecipient : undefined,
  };
}

function toJson(value: DnsInstructionMetadata): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const { id } = await context.params;
    const tenantSiteId = cuid.parse(id);
    const body = await request.json().catch(() => ({}));
    const parsed = sendDnsInstructionsSchema.parse(body);

    const site = await prisma.tenantSite.findUnique({
      where: { id: tenantSiteId },
      include: {
        setupRequest: true,
        siteDomains: { orderBy: [{ domainType: "asc" }, { createdAt: "asc" }] },
      },
    });

    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });

    const domain = parsed.siteDomainId
      ? site.siteDomains.find((candidate) => candidate.id === parsed.siteDomainId)
      : site.siteDomains.find((candidate) => candidate.domainType === "PRIMARY") ?? site.siteDomains[0];

    if (!domain) return NextResponse.json({ ok: false, error: "SITE_DOMAIN_NOT_FOUND" }, { status: 404 });

    const targetEmail = site.setupRequest?.contactEmail?.trim();
    if (!targetEmail) {
      return NextResponse.json({ ok: false, error: "CONTACT_EMAIL_MISSING" }, { status: 400 });
    }

    const currentMetadata = metadataFromJson(domain.dnsInstructions);
    const targetInstructions = currentMetadata.targetInstructions?.trim();
    if (!targetInstructions) {
      return NextResponse.json(
        {
          ok: false,
          error: "DNS_TARGET_MISSING",
          message: "Add DNS/hosting target values before emailing customer instructions.",
        },
        { status: 400 },
      );
    }

    const previewUrl = absoluteAppUrl(`/sites/${encodeURIComponent(site.slug)}`);
    const adminUrl = absoluteAppUrl(`/site-admin/${encodeURIComponent(site.slug)}`);
    const instructionsText = buildDnsInstructionsText({
      businessName: site.displayName,
      domainOption: site.setupRequest?.domainOption,
      requestedDomain: domain.domain,
      previewUrl,
      adminUrl,
      dnsTargetInstructions: targetInstructions,
    });
    const email = siteDnsInstructionsCustomerEmail({
      businessName: site.displayName,
      domain: domain.domain,
      previewUrl,
      adminUrl,
      dnsInstructionsText: instructionsText,
    });

    const emailResult = await sendTransactionalEmail({
      to: targetEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL"),
    });

    if (!emailResult.ok) {
      const failedMetadata = {
        ...currentMetadata,
        lastEmailStatus: emailResult.reason,
        lastEmailError: emailResult.reason,
        lastEmailRecipient: targetEmail,
      } satisfies DnsInstructionMetadata;
      await prisma.siteDomain.update({
        where: { id: domain.id },
        data: { dnsInstructions: toJson(failedMetadata) },
      });
      return NextResponse.json({
        ok: true,
        emailSent: false,
        emailStatus: emailResult.reason,
        domain,
        recommendedNextStatus: site.setupRequest?.domainOption === "WE_REGISTER_DOMAIN" ? "DNS_CONFIGURED" : "WAITING_FOR_CUSTOMER_DNS",
      });
    }

    await applyTenantSiteLifecycleAction(tenantSiteId, "MARK_DNS_INSTRUCTIONS_SENT");

    const sentMetadata = {
      ...currentMetadata,
      targetInstructions,
      lastEmailStatus: "SENT",
      lastEmailSentAt: new Date().toISOString(),
      lastEmailError: null,
      lastEmailRecipient: targetEmail,
    } satisfies DnsInstructionMetadata;
    const updatedDomain = await prisma.siteDomain.update({
      where: { id: domain.id },
      data: { dnsInstructions: toJson(sentMetadata), status: "DNS_INSTRUCTIONS_SENT" },
    });

    return NextResponse.json({
      ok: true,
      emailSent: true,
      emailStatus: "SENT",
      providerMessageId: emailResult.providerMessageId,
      domain: updatedDomain,
      recommendedNextStatus: site.setupRequest?.domainOption === "WE_REGISTER_DOMAIN" ? "DNS_CONFIGURED" : "WAITING_FOR_CUSTOMER_DNS",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "DNS_INSTRUCTIONS_SEND_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}