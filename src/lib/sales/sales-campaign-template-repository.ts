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
    subject: "A complete website for {{industry}} businesses - £30/month",
    body: "Hi {{contactFirstName}},\n\nWe help local businesses in the {{industry}} industry get a professional website that does more than just look good.\n\nMyExperiment.club gives you a managed business website with useful tools built in, including:\n\n* online bookings and enquiry flows\n* services, prices and staff setup\n* rota, breaks and closure settings\n* gift vouchers\n* customer emails and booking updates\n* policies and cancellation wording\n* customer records and booking history\n* payment setup options\n* ongoing support when you need help\n\nPricing is simple: £149 setup, then £30/month.\n\nIf you're currently using {{currentProvider}}, we may also be able to help you reduce monthly costs while giving you more control over your own website.\n\nSee how it works here:\n{{landingPageLink}}\n\nYou can also view an example demo:\n{{demoLink}}\n\nUnsubscribe:\n{{unsubscribeLink}}\n\nMyExperiment.club",
  },
  EMAIL_REMINDER: {
    templateKey: "EMAIL_REMINDER",
    channel: "EMAIL",
    subject: "Still paying too much for your {{industry}} website tools?",
    body: "Hi {{contactFirstName}},\n\nJust checking whether you had a chance to look at MyExperiment.club.\n\nWe build managed websites for local businesses in the {{industry}} industry, with practical business tools included from the start:\n\n* bookings and enquiries\n* services and pricing\n* staff and rota setup\n* gift vouchers\n* customer messages\n* cancellation and policy wording\n* customer records\n* admin controls for your business\n\nIt is designed to give you a proper business website without the usual high monthly software costs.\n\nSimple pricing:\n£149 setup + £30/month.\n\nYou can see the details here:\n{{landingPageLink}}\n\nAnd view an example demo here:\n{{demoLink}}\n\nUnsubscribe:\n{{unsubscribeLink}}\n\nMyExperiment.club",
  },
  SNAIL_MAIL_LETTER: {
    templateKey: "SNAIL_MAIL_LETTER",
    channel: "LETTER",
    subject: "A complete managed website for your {{industry}} business",
    body: "Hi {{contactFirstName}},\n\nI'm getting in touch about MyExperiment.club - a managed website service for local businesses in the {{industry}} industry.\n\nThe idea is simple: we build and support a professional website for your business, but include the tools you need to actually run it day to day.\n\nYour site can include:\n\n* online bookings and enquiries\n* services and pricing\n* staff and rota setup\n* gift vouchers\n* customer emails and booking updates\n* cancellation/policy wording\n* customer records\n* payment setup options\n* ongoing help and support\n\nPricing is straightforward:\n£149 setup, then £30/month.\n\nIf you are already paying for tools such as {{currentProvider}}, this may help you simplify your setup and reduce monthly costs.\n\nScan the QR code below or visit:\n{{landingPageLink}}\n\nMyExperiment.club",
  },
} as const;

const LEGACY_DEFAULTS = {
  EMAIL_INTRODUCTION: "Hi {{contactName}},\n\nWe help local {{industry}} businesses run a professional website with bookings and admin tools for GBP30/month.\n\nIf you're currently using {{currentProvider}}, we may be able to lower monthly costs and simplify your setup.\n\nView demo: {{demoLink}}\nUnsubscribe: {{unsubscribeLink}}\n\nMyExperiment.club",
  EMAIL_REMINDER: "Hi {{contactName}},\n\nQuick follow-up in case you missed us. We can still help {{businessName}} move to a cleaner website plus bookings setup.\n\nView demo: {{demoLink}}\nUnsubscribe: {{unsubscribeLink}}\n\nMyExperiment.club",
  SNAIL_MAIL_LETTER: "Dear {{contactName}},\n\nWe support local {{industry}} businesses with managed websites and booking tools.\n\nIf you'd like to see how this could work for {{businessName}}, preview: {{demoLink}}\n\nMyExperiment.club",
} as const;

export async function listSalesCampaignTemplates() {
  const rows = await prisma.salesCampaignTemplate.findMany({ orderBy: { templateKey: "asc" } });
  if (rows.length >= 3) {
    await prisma.$transaction(
      rows
        .filter((row) => row.body === LEGACY_DEFAULTS[row.templateKey as keyof typeof LEGACY_DEFAULTS])
        .map((row) =>
          prisma.salesCampaignTemplate.update({
            where: { id: row.id },
            data: {
              subject: DEFAULTS[row.templateKey as keyof typeof DEFAULTS].subject,
              body: DEFAULTS[row.templateKey as keyof typeof DEFAULTS].body,
            },
          }),
        ),
    );
    return prisma.salesCampaignTemplate.findMany({ orderBy: { templateKey: "asc" } });
  }

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
