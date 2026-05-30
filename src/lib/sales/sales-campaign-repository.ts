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
