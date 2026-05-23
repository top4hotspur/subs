import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  customerSiteServiceInputSchema,
  deleteCustomerSiteServiceSchema,
  replaceCustomerSiteServicesSchema,
  tenantSiteIdSchema,
  upsertCustomerSiteSettingsSchema,
} from "@/lib/sites/customer-site-settings-schema";

export type CustomerSiteSettingsRecord = {
  id: string;
  tenantSiteId: string;
  siteDisplayName: string | null;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHoursSummary: string | null;
  heroHeadline: string | null;
  heroSubheading: string | null;
  visualThemeId: string | null;
  colourPaletteId: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteServiceRecord = {
  id: string;
  tenantSiteId: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  durationMinutes: number | null;
  bufferAfterMinutes: number | null;
  active: boolean;
  sortOrder: number;
  rolePriceOverrides: unknown;
  createdAt: string;
  updatedAt: string;
};

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

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function serializeSettings(record: {
  id: string;
  tenantSiteId: string;
  siteDisplayName: string | null;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHoursSummary: string | null;
  heroHeadline: string | null;
  heroSubheading: string | null;
  visualThemeId: string | null;
  colourPaletteId: string | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteSettingsRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeService(record: {
  id: string;
  tenantSiteId: string;
  name: string;
  description: string | null;
  basePrice: Prisma.Decimal | null;
  durationMinutes: number | null;
  bufferAfterMinutes: number | null;
  active: boolean;
  sortOrder: number;
  rolePriceOverrides: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteServiceRecord {
  return {
    ...record,
    basePrice: record.basePrice === null ? null : Number(record.basePrice),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getCustomerSiteSettings(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const record = await prisma.customerSiteSettings.findUnique({
    where: { tenantSiteId: parsed.tenantSiteId },
  });
  return record ? serializeSettings(record) : null;
}

export async function upsertCustomerSiteSettings(
  tenantSiteId: string,
  input: Omit<z.infer<typeof upsertCustomerSiteSettingsSchema>, "tenantSiteId">,
) {
  const parsed = parseOrThrow(
    upsertCustomerSiteSettingsSchema,
    { tenantSiteId, ...input },
    "customer site settings",
  );

  const record = await prisma.customerSiteSettings.upsert({
    where: { tenantSiteId: parsed.tenantSiteId },
    create: {
      tenantSiteId: parsed.tenantSiteId,
      siteDisplayName: parsed.siteDisplayName ?? null,
      businessName: parsed.businessName ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      openingHoursSummary: parsed.openingHoursSummary ?? null,
      heroHeadline: parsed.heroHeadline ?? null,
      heroSubheading: parsed.heroSubheading ?? null,
      visualThemeId: parsed.visualThemeId ?? null,
      colourPaletteId: parsed.colourPaletteId ?? null,
      currency: parsed.currency ?? "GBP",
    },
    update: {
      siteDisplayName: parsed.siteDisplayName ?? null,
      businessName: parsed.businessName ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      openingHoursSummary: parsed.openingHoursSummary ?? null,
      heroHeadline: parsed.heroHeadline ?? null,
      heroSubheading: parsed.heroSubheading ?? null,
      visualThemeId: parsed.visualThemeId ?? null,
      colourPaletteId: parsed.colourPaletteId ?? null,
      currency: parsed.currency ?? "GBP",
    },
  });

  return serializeSettings(record);
}

export async function listCustomerSiteServices(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const services = await prisma.customerSiteService.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return services.map(serializeService);
}

export async function replaceCustomerSiteServices(
  tenantSiteId: string,
  services: Array<z.infer<typeof customerSiteServiceInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceCustomerSiteServicesSchema,
    { tenantSiteId, services },
    "replace customer site services",
  );

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteService.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });

    if (parsed.services.length > 0) {
      await tx.customerSiteService.createMany({
        data: parsed.services.map((service, index) => ({
          tenantSiteId: parsed.tenantSiteId,
          name: service.name,
          description: service.description ?? null,
          basePrice: service.basePrice ?? null,
          durationMinutes: service.durationMinutes ?? null,
          bufferAfterMinutes: service.bufferAfterMinutes ?? null,
          active: service.active ?? true,
          sortOrder: service.sortOrder ?? index,
          rolePriceOverrides:
            service.rolePriceOverrides === undefined
              ? undefined
              : service.rolePriceOverrides === null
                ? Prisma.DbNull
                : toJson(service.rolePriceOverrides),
        })),
      });
    }
  });

  return listCustomerSiteServices(parsed.tenantSiteId);
}

export async function upsertCustomerSiteService(
  tenantSiteId: string,
  service: z.infer<typeof customerSiteServiceInputSchema>,
) {
  const parsedTenantSite = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsedService = parseOrThrow(customerSiteServiceInputSchema, service, "customer site service");

  const record = parsedService.id
    ? await (async () => {
        const updated = await prisma.customerSiteService.updateMany({
          where: { id: parsedService.id, tenantSiteId: parsedTenantSite.tenantSiteId },
          data: {
            name: parsedService.name,
            description: parsedService.description ?? null,
            basePrice: parsedService.basePrice ?? null,
            durationMinutes: parsedService.durationMinutes ?? null,
            bufferAfterMinutes: parsedService.bufferAfterMinutes ?? null,
            active: parsedService.active ?? true,
            sortOrder: parsedService.sortOrder ?? 0,
            rolePriceOverrides:
              parsedService.rolePriceOverrides === undefined
                ? undefined
                : parsedService.rolePriceOverrides === null
                  ? Prisma.DbNull
                  : toJson(parsedService.rolePriceOverrides),
          },
        });

        if (updated.count === 0) {
          throw new Error("Customer site service not found");
        }

        const found = await prisma.customerSiteService.findUnique({
          where: { id: parsedService.id },
        });
        if (!found) {
          throw new Error("Customer site service not found");
        }
        return found;
      })()
    : await prisma.customerSiteService.create({
        data: {
          tenantSiteId: parsedTenantSite.tenantSiteId,
          name: parsedService.name,
          description: parsedService.description ?? null,
          basePrice: parsedService.basePrice ?? null,
          durationMinutes: parsedService.durationMinutes ?? null,
          bufferAfterMinutes: parsedService.bufferAfterMinutes ?? null,
          active: parsedService.active ?? true,
          sortOrder: parsedService.sortOrder ?? 0,
          rolePriceOverrides:
            parsedService.rolePriceOverrides === undefined
              ? undefined
              : parsedService.rolePriceOverrides === null
                ? Prisma.DbNull
                : toJson(parsedService.rolePriceOverrides),
        },
      });

  return serializeService(record);
}

export async function deleteCustomerSiteService(tenantSiteId: string, serviceId: string) {
  const parsed = parseOrThrow(
    deleteCustomerSiteServiceSchema,
    { tenantSiteId, serviceId },
    "delete customer site service",
  );

  const deleted = await prisma.customerSiteService.deleteMany({
    where: {
      id: parsed.serviceId,
      tenantSiteId: parsed.tenantSiteId,
    },
  });

  return deleted.count > 0;
}
