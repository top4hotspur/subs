import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { upsertSalesCampaignTemplateSchema } from "@/lib/sales/sales-campaign-template-schema";

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

const DEFAULTS = {
  EMAIL_INTRODUCTION: {
    templateKey: "EMAIL_INTRODUCTION",
    channel: "EMAIL",
    subject: "A better website setup for {{businessName}}",
    body: "Hi {{contactName}},\n\nWe help local {{industry}} businesses run a professional website with bookings and admin tools for GBP30/month.\n\nIf you're currently using {{currentProvider}}, we may be able to lower monthly costs and simplify your setup.\n\nView demo: {{demoLink}}\nUnsubscribe: {{unsubscribeLink}}\n\nMyExperiment.club",
  },
  EMAIL_REMINDER: {
    templateKey: "EMAIL_REMINDER",
    channel: "EMAIL",
    subject: "Quick follow-up for {{businessName}}",
    body: "Hi {{contactName}},\n\nQuick follow-up in case you missed us. We can still help {{businessName}} move to a cleaner website plus bookings setup.\n\nView demo: {{demoLink}}\nUnsubscribe: {{unsubscribeLink}}\n\nMyExperiment.club",
  },
  SNAIL_MAIL_LETTER: {
    templateKey: "SNAIL_MAIL_LETTER",
    channel: "LETTER",
    subject: null,
    body: "Dear {{contactName}},\n\nWe support local {{industry}} businesses with managed websites and booking tools.\n\nIf you'd like to see how this could work for {{businessName}}, preview: {{demoLink}}\n\nMyExperiment.club",
  },
} as const;

export async function listSalesCampaignTemplates() {
  const rows = await prisma.salesCampaignTemplate.findMany({ orderBy: { templateKey: "asc" } });
  if (rows.length >= 3) return rows;

  await prisma.$transaction(
    Object.values(DEFAULTS).map((item) =>
      prisma.salesCampaignTemplate.upsert({
        where: { templateKey: item.templateKey },
        update: {},
        create: item,
      }),
    ),
  );
  return prisma.salesCampaignTemplate.findMany({ orderBy: { templateKey: "asc" } });
}

export async function upsertSalesCampaignTemplate(input: z.infer<typeof upsertSalesCampaignTemplateSchema>) {
  const parsed = parseOrThrow(
    upsertSalesCampaignTemplateSchema,
    input,
    "upsert sales campaign template input",
  );

  return prisma.salesCampaignTemplate.upsert({
    where: { templateKey: parsed.templateKey },
    update: {
      channel: parsed.channel,
      subject: parsed.subject ?? null,
      body: parsed.body,
    },
    create: {
      templateKey: parsed.templateKey,
      channel: parsed.channel,
      subject: parsed.subject ?? null,
      body: parsed.body,
    },
  });
}
