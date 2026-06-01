import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  createSalesCampaignSchema,
  listSalesCampaignsSchema,
  updateSalesCampaignSchema,
} from "@/lib/sales/sales-campaign-schema";

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid ${label} - ${details}`);
  }
  return result.data;
}

export async function createSalesCampaign(input: z.infer<typeof createSalesCampaignSchema>) {
  const parsed = parseOrThrow(createSalesCampaignSchema, input, "create sales campaign input");
  return prisma.salesCampaign.create({
    data: parsed,
  });
}

export async function listSalesCampaigns(input: Partial<z.infer<typeof listSalesCampaignsSchema>> = {}) {
  const parsed = parseOrThrow(listSalesCampaignsSchema, input, "list sales campaign input");
  return prisma.salesCampaign.findMany({
    where: {
      industrySlug: parsed.industrySlug,
      serviceArea: parsed.serviceArea,
      campaignLevel: parsed.campaignLevel,
      status: parsed.status,
    },
    orderBy: { createdAt: "desc" },
    take: parsed.take,
    include: {
      recipients: { select: { id: true, leadId: true, status: true } },
    },
  });
}

export async function updateSalesCampaign(input: z.infer<typeof updateSalesCampaignSchema>) {
  const parsed = parseOrThrow(updateSalesCampaignSchema, input, "update sales campaign input");
  return prisma.salesCampaign.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      industrySlug: parsed.industrySlug,
      serviceArea: parsed.serviceArea,
      campaignLevel: parsed.campaignLevel,
      status: parsed.status,
    },
  });
}

export async function markSalesCampaignPrepared(input: {
  campaignId: string;
  leadIds: string[];
}) {
  const campaignId = z.string().cuid().parse(input.campaignId);
  const leadIds = z.array(z.string().cuid()).parse(input.leadIds);

  return prisma.$transaction(async (tx) => {
    for (const leadId of leadIds) {
      await tx.salesCampaignRecipient.upsert({
        where: { campaignId_leadId: { campaignId, leadId } },
        update: { status: "QUEUED" },
        create: { campaignId, leadId, status: "QUEUED" },
      });
    }

    const campaign = await tx.salesCampaign.update({
      where: { id: campaignId },
      data: { status: "PREPARED" },
      include: { recipients: true },
    });

    return campaign;
  });
}

export async function markSalesCampaignSentManual(input: {
  campaignId: string;
  leadIds: string[];
  templateKey: "EMAIL_INTRODUCTION" | "EMAIL_REMINDER" | "SNAIL_MAIL_LETTER";
}) {
  const campaignId = z.string().cuid().parse(input.campaignId);
  const leadIds = z.array(z.string().cuid()).parse(input.leadIds);
  const templateKey = z
    .enum(["EMAIL_INTRODUCTION", "EMAIL_REMINDER", "SNAIL_MAIL_LETTER"])
    .parse(input.templateKey);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const recipients = await Promise.all(
      leadIds.map((leadId) =>
        tx.salesCampaignRecipient.upsert({
          where: { campaignId_leadId: { campaignId, leadId } },
          update: { status: "MARKED_SENT", sentAt: now, lastEventAt: now },
          create: {
            campaignId,
            leadId,
            status: "MARKED_SENT",
            sentAt: now,
            lastEventAt: now,
          },
        }),
      ),
    );

    let updatedLeadCount = 0;
    for (const leadId of leadIds) {
      const lead = await tx.salesLead.findUnique({ where: { id: leadId } });
      if (!lead) continue;
      await tx.salesLead.update({
        where: { id: leadId },
        data: {
          lastContactedAt: now,
          lastMarketingEmailAt: templateKey === "SNAIL_MAIL_LETTER" ? lead.lastMarketingEmailAt : now,
          emailSentCount: templateKey === "SNAIL_MAIL_LETTER" ? lead.emailSentCount : { increment: 1 },
          lastCampaignStep: templateKey,
          status: lead.status === "NEW" ? "CONTACTED" : lead.status,
        },
      });
      await tx.salesLeadEvent.create({
        data: {
          salesLeadId: leadId,
          eventType: "CAMPAIGN_MARKED_SENT_MANUAL",
          message: `Lead marked as sent for ${templateKey}.`,
          metadata: { campaignId, templateKey },
        },
      });
      updatedLeadCount += 1;
    }

    const campaign = await tx.salesCampaign.update({
      where: { id: campaignId },
      data: { status: "SENT" },
      include: { recipients: true },
    });

    return { campaign, recipients, updatedLeadCount };
  });
}
