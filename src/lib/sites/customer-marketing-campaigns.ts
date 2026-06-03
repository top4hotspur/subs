import { getOptionalServerEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { isEmailConfigured, sendTransactionalEmail } from "@/lib/email/email-provider";
import { renderCustomerMarketingEmail } from "@/lib/sites/customer-marketing-email";
import { createCustomerMarketingUnsubscribeToken } from "@/lib/sites/customer-marketing-unsubscribe-token";

export const CUSTOMER_CAMPAIGN_TYPES = [
  "GENERAL_OFFER",
  "LAPSED_CUSTOMER_OFFER",
  "BOOKING_FOLLOW_UP",
  "SEASONAL_OFFER",
  "CUSTOM",
] as const;

export const CUSTOMER_CAMPAIGN_AUDIENCES = [
  "ALL_OPTED_IN",
  "SELECTED_CUSTOMERS",
  "LAPSED_CUSTOMERS",
  "CUSTOMERS_WITH_BOOKING_HISTORY",
] as const;

export type CustomerCampaignType = (typeof CUSTOMER_CAMPAIGN_TYPES)[number];
export type CustomerCampaignAudience = (typeof CUSTOMER_CAMPAIGN_AUDIENCES)[number];

type CampaignInput = {
  title: string;
  subject: string;
  body: string;
  campaignType: CustomerCampaignType;
  audienceType: CustomerCampaignAudience;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type CustomerMarketingSendResult = {
  ok: boolean;
  error?: string;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{ customerId: string; email: string; outcome: "SENT" | "SKIPPED" | "FAILED"; reason?: string }>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAPSED_MS = 90 * 24 * 60 * 60 * 1000;

function customerName(customer: { firstName: string; lastName: string | null }): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
}

function cleanUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed;
}

export async function listCustomerMarketingCampaigns(tenantSiteId: string) {
  const campaigns = await prisma.customerSiteMarketingCampaign.findMany({
    where: { tenantSiteId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      recipients: {
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      },
    },
  });
  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    subject: campaign.subject,
    body: campaign.body,
    campaignType: campaign.campaignType,
    status: campaign.status,
    audienceType: campaign.audienceType,
    ctaLabel: campaign.ctaLabel,
    ctaUrl: campaign.ctaUrl,
    sentAt: campaign.sentAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    counts: {
      sent: campaign.recipients.filter((recipient) => recipient.status === "SENT").length,
      failed: campaign.recipients.filter((recipient) => recipient.status === "FAILED").length,
      skipped: campaign.recipients.filter((recipient) => recipient.status.startsWith("SKIPPED")).length,
      total: campaign.recipients.length,
    },
    recipients: campaign.recipients.map((recipient) => ({
      id: recipient.id,
      email: recipient.email,
      name: recipient.name,
      status: recipient.status,
      sentAt: recipient.sentAt?.toISOString() ?? null,
      failureReason: recipient.failureReason,
      createdAt: recipient.createdAt.toISOString(),
    })),
  }));
}

export async function createCustomerMarketingCampaign(tenantSiteId: string, input: CampaignInput) {
  return prisma.customerSiteMarketingCampaign.create({
    data: {
      tenantSiteId,
      title: input.title.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      campaignType: input.campaignType,
      audienceType: input.audienceType,
      ctaLabel: input.ctaLabel?.trim() || null,
      ctaUrl: cleanUrl(input.ctaUrl),
      status: "DRAFT",
    },
  });
}

export async function updateCustomerMarketingCampaign(
  tenantSiteId: string,
  campaignId: string,
  input: Partial<CampaignInput> & { status?: string },
) {
  const existing = await prisma.customerSiteMarketingCampaign.findFirst({
    where: { id: campaignId, tenantSiteId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.customerSiteMarketingCampaign.update({
    where: { id: campaignId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.subject !== undefined ? { subject: input.subject.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.campaignType !== undefined ? { campaignType: input.campaignType } : {}),
      ...(input.audienceType !== undefined ? { audienceType: input.audienceType } : {}),
      ...(input.ctaLabel !== undefined ? { ctaLabel: input.ctaLabel?.trim() || null } : {}),
      ...(input.ctaUrl !== undefined ? { ctaUrl: cleanUrl(input.ctaUrl) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
}

async function findAudienceCustomers(input: {
  tenantSiteId: string;
  audienceType: string;
  selectedCustomerIds: string[];
}) {
  const customers = await prisma.customerSiteCustomer.findMany({
    where: { tenantSiteId: input.tenantSiteId, active: true },
    include: {
      bookings: {
        select: { preferredDate: true, startDateTime: true, status: true, createdAt: true },
        orderBy: [{ createdAt: "desc" }],
      },
    },
  });
  const selected = new Set(input.selectedCustomerIds);
  const now = new Date();
  return customers.filter((customer) => {
    if (input.audienceType === "SELECTED_CUSTOMERS") return selected.has(customer.id);
    if (input.audienceType === "CUSTOMERS_WITH_BOOKING_HISTORY") return customer.bookings.length > 0;
    if (input.audienceType === "LAPSED_CUSTOMERS") {
      const hasUpcoming = customer.bookings.some((booking) => {
        const date = booking.startDateTime ?? (booking.preferredDate ? new Date(`${booking.preferredDate}T00:00:00.000Z`) : null);
        return date !== null && date >= now && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
      });
      const latestPast = customer.bookings
        .map((booking) => booking.startDateTime ?? (booking.preferredDate ? new Date(`${booking.preferredDate}T00:00:00.000Z`) : booking.createdAt))
        .filter((date) => date < now)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      return customer.bookings.length > 0 && !hasUpcoming && Boolean(latestPast) && latestPast.getTime() <= now.getTime() - LAPSED_MS;
    }
    return true;
  });
}

function skipReason(customer: {
  email: string;
  marketingOptIn: boolean;
  active: boolean;
}): string | null {
  if (!customer.active) return "SKIPPED_DO_NOT_CONTACT";
  if (!customer.email) return "FAILED_NO_EMAIL";
  if (!EMAIL_RE.test(customer.email)) return "FAILED_INVALID_EMAIL";
  if (!customer.marketingOptIn) return "SKIPPED_NO_CONSENT";
  return null;
}

export async function sendCustomerMarketingCampaign(input: {
  tenantSiteId: string;
  siteSlug: string;
  campaignId: string;
  selectedCustomerIds?: string[];
}): Promise<CustomerMarketingSendResult> {
  const campaign = await prisma.customerSiteMarketingCampaign.findUnique({
    where: { id: input.campaignId },
  });
  if (!campaign || campaign.tenantSiteId !== input.tenantSiteId) {
    return { ok: false, error: "CAMPAIGN_NOT_FOUND", sentCount: 0, skippedCount: 0, failedCount: 0, details: [] };
  }
  if (campaign.status === "SENT" || campaign.status === "CANCELLED") {
    return { ok: false, error: "CAMPAIGN_NOT_SENDABLE", sentCount: 0, skippedCount: 0, failedCount: 0, details: [] };
  }
  if (!isEmailConfigured()) {
    return {
      ok: false,
      error: "EMAIL_NOT_CONFIGURED",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      details: [],
    };
  }

  const site = await prisma.tenantSite.findUnique({
    where: { id: input.tenantSiteId },
    include: { customerSiteSettings: true },
  });
  if (!site) {
    return { ok: false, error: "SITE_NOT_FOUND", sentCount: 0, skippedCount: 0, failedCount: 0, details: [] };
  }

  const businessName = site.customerSiteSettings?.siteDisplayName || site.customerSiteSettings?.businessName || site.displayName;
  const baseUrl = (getOptionalServerEnv("NEXT_PUBLIC_SITE_URL") ?? "https://myexperiment.club").replace(/\/+$/, "");
  const now = new Date();
  const selectedCustomerIds = input.selectedCustomerIds ?? [];
  const customers = await findAudienceCustomers({
    tenantSiteId: input.tenantSiteId,
    audienceType: campaign.audienceType,
    selectedCustomerIds,
  });
  const details: CustomerMarketingSendResult["details"] = [];
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const seen = new Set<string>();

  for (const customer of customers) {
    const email = customer.email.trim().toLowerCase();
    if (seen.has(email)) {
      skippedCount += 1;
      details.push({ customerId: customer.id, email, outcome: "SKIPPED", reason: "SKIPPED_DUPLICATE_RECIPIENT" });
      continue;
    }
    seen.add(email);

    const existingRecipient = await prisma.customerSiteMarketingCampaignRecipient.findUnique({
      where: { campaignId_email: { campaignId: campaign.id, email } },
    });
    if (existingRecipient?.status === "SENT") {
      skippedCount += 1;
      details.push({ customerId: customer.id, email, outcome: "SKIPPED", reason: "SKIPPED_ALREADY_SENT" });
      continue;
    }

    const reason = skipReason(customer);
    if (reason) {
      const status = reason.startsWith("SKIPPED") ? reason : "FAILED";
      await prisma.customerSiteMarketingCampaignRecipient.upsert({
        where: { campaignId_email: { campaignId: campaign.id, email } },
        update: { status, failureReason: reason },
        create: {
          campaignId: campaign.id,
          tenantSiteId: input.tenantSiteId,
          customerSiteCustomerId: customer.id,
          email,
          name: customerName(customer),
          status,
          failureReason: reason,
        },
      });
      if (status === "FAILED") failedCount += 1;
      else skippedCount += 1;
      details.push({ customerId: customer.id, email, outcome: status === "FAILED" ? "FAILED" : "SKIPPED", reason });
      continue;
    }

    const unsubscribeToken = createCustomerMarketingUnsubscribeToken({
      tenantSiteId: input.tenantSiteId,
      siteSlug: input.siteSlug,
      customerId: customer.id,
      email,
    });
    const unsubscribeLink = `${baseUrl}/sites/${encodeURIComponent(input.siteSlug)}/unsubscribe/customer-marketing?token=${encodeURIComponent(unsubscribeToken)}`;
    const rendered = renderCustomerMarketingEmail({
      businessName,
      title: campaign.title,
      subject: campaign.subject,
      body: campaign.body,
      ctaLabel: campaign.ctaLabel,
      ctaUrl: campaign.ctaUrl,
      contactEmail: site.customerSiteSettings?.email,
      contactPhone: site.customerSiteSettings?.phone,
      unsubscribeLink,
    });
    const sendResult = await sendTransactionalEmail({
      to: email,
      subject: campaign.subject,
      text: rendered.text,
      html: rendered.html,
      replyTo: site.customerSiteSettings?.email ?? undefined,
    });
    if (!sendResult.ok) {
      failedCount += 1;
      await prisma.customerSiteMarketingCampaignRecipient.upsert({
        where: { campaignId_email: { campaignId: campaign.id, email } },
        update: { status: "FAILED", failureReason: sendResult.reason },
        create: {
          campaignId: campaign.id,
          tenantSiteId: input.tenantSiteId,
          customerSiteCustomerId: customer.id,
          email,
          name: customerName(customer),
          status: "FAILED",
          failureReason: sendResult.reason,
        },
      });
      details.push({ customerId: customer.id, email, outcome: "FAILED", reason: sendResult.reason });
      continue;
    }

    await prisma.customerSiteMarketingCampaignRecipient.upsert({
      where: { campaignId_email: { campaignId: campaign.id, email } },
      update: {
        customerSiteCustomerId: customer.id,
        name: customerName(customer),
        status: "SENT",
        sentAt: now,
        failureReason: null,
      },
      create: {
        campaignId: campaign.id,
        tenantSiteId: input.tenantSiteId,
        customerSiteCustomerId: customer.id,
        email,
        name: customerName(customer),
        status: "SENT",
        sentAt: now,
      },
    });
    sentCount += 1;
    details.push({ customerId: customer.id, email, outcome: "SENT" });
  }

  if (sentCount > 0) {
    await prisma.customerSiteMarketingCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT", sentAt: now },
    });
  }

  return { ok: true, sentCount, skippedCount, failedCount, details };
}
