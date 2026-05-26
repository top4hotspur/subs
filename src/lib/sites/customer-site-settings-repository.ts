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
  logoUrl: string | null;
  logoStorageKey: string | null;
  logoContentType: string | null;
  logoFileName: string | null;
  faviconUrl: string | null;
  faviconStorageKey: string | null;
  faviconContentType: string | null;
  faviconFileName: string | null;
  paymentProcessorSetupMode: string | null;
  paymentProcessorName: string | null;
  paymentProcessorAccountRef: string | null;
  paymentProcessorNotes: string | null;
  acceptCashPayments: boolean;
  acceptCardPayments: boolean;
  requireBookingPrepayment: boolean;
  allowInStorePaymentRecording: boolean;
  cancellationFullRefundNoticeDays: number | null;
  cancellationNoRefundWithinDays: number | null;
  cancellationPolicyNote: string | null;
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
  logoUrl: string | null;
  logoStorageKey: string | null;
  logoContentType: string | null;
  logoFileName: string | null;
  faviconUrl: string | null;
  faviconStorageKey: string | null;
  faviconContentType: string | null;
  faviconFileName: string | null;
  paymentProcessorSetupMode: string | null;
  paymentProcessorName: string | null;
  paymentProcessorAccountRef: string | null;
  paymentProcessorNotes: string | null;
  acceptCashPayments: boolean;
  acceptCardPayments: boolean;
  requireBookingPrepayment: boolean;
  allowInStorePaymentRecording: boolean;
  cancellationFullRefundNoticeDays: number | null;
  cancellationNoRefundWithinDays: number | null;
  cancellationPolicyNote: string | null;
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

  const createData: Prisma.CustomerSiteSettingsUncheckedCreateInput = {
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
    logoUrl: parsed.logoUrl ?? null,
    logoStorageKey: parsed.logoStorageKey ?? null,
    logoContentType: parsed.logoContentType ?? null,
    logoFileName: parsed.logoFileName ?? null,
    faviconUrl: parsed.faviconUrl ?? null,
    faviconStorageKey: parsed.faviconStorageKey ?? null,
    faviconContentType: parsed.faviconContentType ?? null,
    faviconFileName: parsed.faviconFileName ?? null,
    paymentProcessorSetupMode: parsed.paymentProcessorSetupMode ?? null,
    paymentProcessorName: parsed.paymentProcessorName ?? null,
    paymentProcessorAccountRef: parsed.paymentProcessorAccountRef ?? null,
    paymentProcessorNotes: parsed.paymentProcessorNotes ?? null,
    acceptCashPayments: parsed.acceptCashPayments ?? false,
    acceptCardPayments: parsed.acceptCardPayments ?? true,
    requireBookingPrepayment: parsed.requireBookingPrepayment ?? false,
    allowInStorePaymentRecording: parsed.allowInStorePaymentRecording ?? false,
    cancellationFullRefundNoticeDays: parsed.cancellationFullRefundNoticeDays ?? 1,
    cancellationNoRefundWithinDays: parsed.cancellationNoRefundWithinDays ?? 1,
    cancellationPolicyNote: parsed.cancellationPolicyNote ?? null,
  };
  const updateData: Prisma.CustomerSiteSettingsUncheckedUpdateInput = {};
  if (parsed.siteDisplayName !== undefined) updateData.siteDisplayName = parsed.siteDisplayName;
  if (parsed.businessName !== undefined) updateData.businessName = parsed.businessName;
  if (parsed.phone !== undefined) updateData.phone = parsed.phone;
  if (parsed.email !== undefined) updateData.email = parsed.email;
  if (parsed.address !== undefined) updateData.address = parsed.address;
  if (parsed.openingHoursSummary !== undefined) {
    updateData.openingHoursSummary = parsed.openingHoursSummary;
  }
  if (parsed.heroHeadline !== undefined) updateData.heroHeadline = parsed.heroHeadline;
  if (parsed.heroSubheading !== undefined) updateData.heroSubheading = parsed.heroSubheading;
  if (parsed.visualThemeId !== undefined) updateData.visualThemeId = parsed.visualThemeId;
  if (parsed.colourPaletteId !== undefined) updateData.colourPaletteId = parsed.colourPaletteId;
  if (parsed.currency !== undefined) updateData.currency = parsed.currency;
  if (parsed.logoUrl !== undefined) updateData.logoUrl = parsed.logoUrl;
  if (parsed.logoStorageKey !== undefined) updateData.logoStorageKey = parsed.logoStorageKey;
  if (parsed.logoContentType !== undefined) updateData.logoContentType = parsed.logoContentType;
  if (parsed.logoFileName !== undefined) updateData.logoFileName = parsed.logoFileName;
  if (parsed.faviconUrl !== undefined) updateData.faviconUrl = parsed.faviconUrl;
  if (parsed.faviconStorageKey !== undefined) updateData.faviconStorageKey = parsed.faviconStorageKey;
  if (parsed.faviconContentType !== undefined) updateData.faviconContentType = parsed.faviconContentType;
  if (parsed.faviconFileName !== undefined) updateData.faviconFileName = parsed.faviconFileName;
  if (parsed.paymentProcessorSetupMode !== undefined) {
    updateData.paymentProcessorSetupMode = parsed.paymentProcessorSetupMode;
  }
  if (parsed.paymentProcessorName !== undefined) {
    updateData.paymentProcessorName = parsed.paymentProcessorName;
  }
  if (parsed.paymentProcessorAccountRef !== undefined) {
    updateData.paymentProcessorAccountRef = parsed.paymentProcessorAccountRef;
  }
  if (parsed.paymentProcessorNotes !== undefined) {
    updateData.paymentProcessorNotes = parsed.paymentProcessorNotes;
  }
  if (parsed.acceptCashPayments !== undefined) {
    updateData.acceptCashPayments = parsed.acceptCashPayments;
  }
  if (parsed.acceptCardPayments !== undefined) {
    updateData.acceptCardPayments = parsed.acceptCardPayments;
  }
  if (parsed.requireBookingPrepayment !== undefined) {
    updateData.requireBookingPrepayment = parsed.requireBookingPrepayment;
  }
  if (parsed.allowInStorePaymentRecording !== undefined) {
    updateData.allowInStorePaymentRecording = parsed.allowInStorePaymentRecording;
  }
  if (parsed.cancellationFullRefundNoticeDays !== undefined) {
    updateData.cancellationFullRefundNoticeDays = parsed.cancellationFullRefundNoticeDays;
  }
  if (parsed.cancellationNoRefundWithinDays !== undefined) {
    updateData.cancellationNoRefundWithinDays = parsed.cancellationNoRefundWithinDays;
  }
  if (parsed.cancellationPolicyNote !== undefined) {
    updateData.cancellationPolicyNote = parsed.cancellationPolicyNote;
  }

  const record = await prisma.customerSiteSettings.upsert({
    where: { tenantSiteId: parsed.tenantSiteId },
    create: createData,
    update: updateData,
  });

  return serializeSettings(record);
}

export async function updateCustomerSiteBrandingMedia(
  tenantSiteId: string,
  input: {
    logoUrl?: string | null;
    logoStorageKey?: string | null;
    logoContentType?: string | null;
    logoFileName?: string | null;
    faviconUrl?: string | null;
    faviconStorageKey?: string | null;
    faviconContentType?: string | null;
    faviconFileName?: string | null;
  },
) {
  const parsedTenantSite = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const data: Prisma.CustomerSiteSettingsUncheckedUpdateInput = {};

  if ("logoUrl" in input) data.logoUrl = input.logoUrl ?? null;
  if ("logoStorageKey" in input) data.logoStorageKey = input.logoStorageKey ?? null;
  if ("logoContentType" in input) data.logoContentType = input.logoContentType ?? null;
  if ("logoFileName" in input) data.logoFileName = input.logoFileName ?? null;
  if ("faviconUrl" in input) data.faviconUrl = input.faviconUrl ?? null;
  if ("faviconStorageKey" in input) data.faviconStorageKey = input.faviconStorageKey ?? null;
  if ("faviconContentType" in input) data.faviconContentType = input.faviconContentType ?? null;
  if ("faviconFileName" in input) data.faviconFileName = input.faviconFileName ?? null;

  const record = await prisma.customerSiteSettings.upsert({
    where: { tenantSiteId: parsedTenantSite.tenantSiteId },
    create: {
      tenantSiteId: parsedTenantSite.tenantSiteId,
      currency: "GBP",
      logoUrl: data.logoUrl as string | null | undefined,
      logoStorageKey: data.logoStorageKey as string | null | undefined,
      logoContentType: data.logoContentType as string | null | undefined,
      logoFileName: data.logoFileName as string | null | undefined,
      faviconUrl: data.faviconUrl as string | null | undefined,
      faviconStorageKey: data.faviconStorageKey as string | null | undefined,
      faviconContentType: data.faviconContentType as string | null | undefined,
      faviconFileName: data.faviconFileName as string | null | undefined,
    },
    update: data,
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
