import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  createSalesProviderPricingSchema,
  updateSalesProviderPricingSchema,
} from "@/lib/sales/sales-provider-pricing-schema";

const DEFAULT_PROVIDER_ROWS = [
  { providerKey: "booksy", providerName: "Booksy", estimatedMonthlyGbp: 40, active: true },
  { providerKey: "fresha", providerName: "Fresha", estimatedMonthlyGbp: 29, active: true },
  { providerKey: "treatwell", providerName: "Treatwell", estimatedMonthlyGbp: 35, active: true },
  { providerKey: "wix", providerName: "Wix", estimatedMonthlyGbp: 22, active: true },
  { providerKey: "squarespace", providerName: "Squarespace", estimatedMonthlyGbp: 20, active: true },
  { providerKey: "godaddy", providerName: "GoDaddy", estimatedMonthlyGbp: 15, active: true },
  { providerKey: "shopify", providerName: "Shopify", estimatedMonthlyGbp: 25, active: true },
  { providerKey: "other-manual", providerName: "Other/manual", estimatedMonthlyGbp: null, active: true },
] as const;

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

export async function listSalesProviderPricing() {
  const rows = await prisma.salesProviderPricing.findMany({ orderBy: [{ active: "desc" }, { providerName: "asc" }] });
  if (rows.length > 0) return rows;

  await prisma.$transaction(
    DEFAULT_PROVIDER_ROWS.map((row) =>
      prisma.salesProviderPricing.upsert({
        where: { providerKey: row.providerKey },
        update: {},
        create: row,
      }),
    ),
  );
  return prisma.salesProviderPricing.findMany({ orderBy: [{ active: "desc" }, { providerName: "asc" }] });
}

export async function createSalesProviderPricing(input: z.infer<typeof createSalesProviderPricingSchema>) {
  const parsed = parseOrThrow(createSalesProviderPricingSchema, input, "create sales provider pricing input");
  return prisma.salesProviderPricing.create({
    data: {
      providerKey: parsed.providerKey.trim().toLowerCase().replace(/\s+/g, "-"),
      providerName: parsed.providerName,
      estimatedMonthlyGbp: parsed.estimatedMonthlyGbp,
      notes: parsed.notes ?? null,
      active: parsed.active,
    },
  });
}

export async function updateSalesProviderPricing(input: z.infer<typeof updateSalesProviderPricingSchema>) {
  const parsed = parseOrThrow(updateSalesProviderPricingSchema, input, "update sales provider pricing input");
  return prisma.salesProviderPricing.update({
    where: { id: parsed.id },
    data: {
      providerName: parsed.providerName,
      estimatedMonthlyGbp: parsed.estimatedMonthlyGbp,
      notes: parsed.notes,
      active: parsed.active,
    },
  });
}

export async function getProviderEstimateByNameOrKey(provider?: string | null): Promise<number | null> {
  if (!provider) return null;
  const clean = provider.trim().toLowerCase();
  const row = await prisma.salesProviderPricing.findFirst({
    where: {
      active: true,
      OR: [
        { providerKey: clean },
        { providerName: { equals: provider.trim(), mode: "insensitive" } },
      ],
    },
  });
  return row?.estimatedMonthlyGbp ? Number(row.estimatedMonthlyGbp) : null;
}
