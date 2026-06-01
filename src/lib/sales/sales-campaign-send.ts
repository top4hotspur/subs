import { prisma } from "@/lib/db/prisma";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { isEmailConfigured, sendTransactionalEmail } from "@/lib/email/email-provider";
import { buildSalesCampaignEmailHtml, buildSalesCampaignPlainText } from "@/lib/sales/sales-campaign-email-render";
import { createSalesUnsubscribeToken } from "@/lib/sales/sales-unsubscribe-token";

type TemplateKey = "EMAIL_INTRODUCTION" | "EMAIL_REMINDER" | "SNAIL_MAIL_LETTER";

export type SalesCampaignSendResult = {
  ok: boolean;
  error?: string;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{ leadId: string; outcome: "SENT" | "SKIPPED" | "FAILED"; reason?: string }>;
};

function formatIndustryLabel(slug?: string | null): string {
  if (!slug) return "local services";
  return slug
    .split("-")
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatIndustryBusinessType(slug?: string | null): string {
  const label = formatIndustryLabel(slug).toLowerCase();
  if (label.endsWith("ers")) return label.slice(0, -1);
  if (label.endsWith("s")) return label.slice(0, -1);
  return label;
}

function renderTemplateForLead(
  template: { subject: string | null; body: string },
  lead: {
    id: string;
    businessName: string;
    industrySlug: string | null;
    contactName: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    currentProvider: string | null;
    estimatedCurrentMonthlyCost: unknown;
  },
): { subject: string; text: string } {
  const baseUrl = (getOptionalServerEnv("NEXT_PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "");
  const safeIndustry = lead.industrySlug || "barbers";
  const industryLabel = formatIndustryLabel(safeIndustry);
  const industryBusinessType = formatIndustryBusinessType(safeIndustry);
  const contactName = [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(" ").trim() || lead.contactName || "";
  const contactFirstName = lead.contactFirstName || contactName || "";
  const unsubscribeToken = createSalesUnsubscribeToken(lead.id);
  const unsubscribeLink = `${baseUrl}/unsubscribe/sales?token=${encodeURIComponent(unsubscribeToken)}`;

  const values: Record<string, string> = {
    contactFirstName,
    contactLastName: lead.contactLastName || "",
    contactName,
    businessName: lead.businessName,
    industry: industryLabel,
    industryLabel,
    industryBusinessType,
    currentProvider: lead.currentProvider || "your current provider",
    estimatedCurrentMonthlyCost: String(lead.estimatedCurrentMonthlyCost ?? "unknown"),
    landingPageLink: `${baseUrl}/${safeIndustry}`,
    demoLink: `${baseUrl}/demo/${safeIndustry}`,
    unsubscribeLink,
  };

  let subject = template.subject || "MyExperiment.club";
  let body = template.body;
  for (const [key, value] of Object.entries(values)) {
    subject = subject.replaceAll(`{{${key}}}`, value);
    body = body.replaceAll(`{{${key}}}`, value);
  }
  body = body.replaceAll("Hi ,", "Hi,");
  if (!body.includes("unsubscribe") && !body.includes("Unsubscribe")) {
    body = `${body}\n\nUnsubscribe:\n${unsubscribeLink}`;
  }
  return { subject, text: body };
}

function leadSkipReason(
  lead: {
    email: string | null;
    marketingStatus: string;
    snoozedUntil: Date | null;
    lastCampaignStep: string | null;
  },
  templateKey: TemplateKey,
): string | null {
  if (!lead.email) return "NO_EMAIL";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "INVALID_EMAIL";
  if (["UNSUBSCRIBED", "DO_NOT_CONTACT", "BOUNCED", "CONVERTED"].includes(lead.marketingStatus)) {
    return `SUPPRESSED_${lead.marketingStatus}`;
  }
  if (lead.snoozedUntil && lead.snoozedUntil > new Date()) return "SNOOZED";
  if (lead.lastCampaignStep === templateKey) return "ALREADY_RECEIVED_STEP";
  return null;
}

export async function sendSalesCampaignEmails(input: {
  campaignId: string;
  leadIds: string[];
  templateKey: TemplateKey;
}): Promise<SalesCampaignSendResult> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      error: "EMAIL_NOT_CONFIGURED",
      sentCount: 0,
      skippedCount: input.leadIds.length,
      failedCount: 0,
      details: input.leadIds.map((leadId) => ({ leadId, outcome: "SKIPPED", reason: "EMAIL_NOT_CONFIGURED" })),
    };
  }

  const template = await prisma.salesCampaignTemplate.findUnique({ where: { templateKey: input.templateKey } });
  if (!template) {
    return { ok: false, error: "TEMPLATE_NOT_FOUND", sentCount: 0, skippedCount: 0, failedCount: 0, details: [] };
  }

  const leads = await prisma.salesLead.findMany({
    where: { id: { in: input.leadIds } },
  });
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const now = new Date();
  const details: SalesCampaignSendResult["details"] = [];
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const leadId of input.leadIds) {
    const lead = leadsById.get(leadId);
    if (!lead) {
      details.push({ leadId, outcome: "SKIPPED", reason: "NOT_FOUND" });
      skippedCount += 1;
      continue;
    }
    const skip = leadSkipReason(lead, input.templateKey);
    if (skip) {
      details.push({ leadId, outcome: "SKIPPED", reason: skip });
      skippedCount += 1;
      await prisma.salesCampaignRecipient.upsert({
        where: { campaignId_leadId: { campaignId: input.campaignId, leadId } },
        update: { status: "SKIPPED", lastEventAt: now },
        create: { campaignId: input.campaignId, leadId, status: "SKIPPED", lastEventAt: now },
      });
      continue;
    }

    const rendered = renderTemplateForLead(template, lead);
    const baseUrl = (getOptionalServerEnv("NEXT_PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "");
    const safeIndustry = lead.industrySlug || "barbers";
    const unsubscribeLink = `${baseUrl}/unsubscribe/sales?token=${encodeURIComponent(createSalesUnsubscribeToken(lead.id))}`;
    const plainText = buildSalesCampaignPlainText(rendered.text, {
      landingPageLink: `${baseUrl}/${safeIndustry}`,
      demoLink: `${baseUrl}/demo/${safeIndustry}`,
      unsubscribeLink,
    });
    const html = buildSalesCampaignEmailHtml(rendered.subject, plainText, {
      landingPageLink: `${baseUrl}/${safeIndustry}`,
      demoLink: `${baseUrl}/demo/${safeIndustry}`,
      unsubscribeLink,
      siteUrl: baseUrl,
    });
    const sendResult = await sendTransactionalEmail({
      to: lead.email!,
      subject: rendered.subject,
      text: plainText,
      html,
    });

    if (!sendResult.ok) {
      details.push({ leadId, outcome: "FAILED", reason: sendResult.reason });
      failedCount += 1;
      await prisma.salesCampaignRecipient.upsert({
        where: { campaignId_leadId: { campaignId: input.campaignId, leadId } },
        update: { status: "FAILED", lastEventAt: now },
        create: { campaignId: input.campaignId, leadId, status: "FAILED", lastEventAt: now },
      });
      continue;
    }

    await prisma.$transaction([
      prisma.salesCampaignRecipient.upsert({
        where: { campaignId_leadId: { campaignId: input.campaignId, leadId } },
        update: { status: "SENT", sentAt: now, lastEventAt: now },
        create: { campaignId: input.campaignId, leadId, status: "SENT", sentAt: now, lastEventAt: now },
      }),
      prisma.salesLead.update({
        where: { id: leadId },
        data: {
          lastContactedAt: now,
          lastMarketingEmailAt: now,
          emailSentCount: { increment: 1 },
          lastCampaignStep: input.templateKey,
          status: lead.status === "NEW" ? "CONTACTED" : lead.status,
        },
      }),
      prisma.salesLeadEvent.create({
        data: {
          salesLeadId: leadId,
          eventType: "CAMPAIGN_EMAIL_SENT",
          message: `Campaign ${input.templateKey} email sent.`,
          metadata: {
            campaignId: input.campaignId,
            templateKey: input.templateKey,
            providerMessageId: sendResult.providerMessageId ?? null,
          },
        },
      }),
    ]);
    details.push({ leadId, outcome: "SENT" });
    sentCount += 1;
  }

  await prisma.salesCampaign.update({
    where: { id: input.campaignId },
    data: { status: sentCount > 0 ? "SENT" : "PREPARED" },
  });

  return { ok: true, sentCount, skippedCount, failedCount, details };
}
