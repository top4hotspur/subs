import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  createSalesLeadEventSchema,
  createSalesLeadSchema,
  listSalesLeadsSchema,
  markSalesLeadContactedSchema,
  updateSalesLeadSchema,
} from "@/lib/sales/sales-lead-schema";
import {
  CreateSalesLeadEventInput,
  CreateSalesLeadInput,
  ListSalesLeadsInput,
  MarkSalesLeadContactedInput,
  UpdateSalesLeadInput,
} from "@/lib/sales/sales-lead-types";

const salesLeadIdSchema = z.string().cuid();

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

export async function createSalesLead(input: CreateSalesLeadInput) {
  const parsed = parseOrThrow(createSalesLeadSchema, input, "create sales lead input");
  const lead = await prisma.salesLead.create({
    data: {
      businessName: parsed.businessName,
      location: parsed.location,
      country: parsed.country,
      cityTown: parsed.cityTown,
      postcode: parsed.postcode,
      address: parsed.address,
      serviceArea: parsed.serviceArea,
      industrySlug: parsed.industrySlug,
      industryLabel: parsed.industryLabel,
      contactName: parsed.contactName,
      email: parsed.email,
      phone: parsed.phone,
      leadSource: parsed.leadSource,
      sourceUrl: parsed.sourceUrl,
      currentProvider: parsed.currentProvider,
      estimatedCurrentMonthlyCost: parsed.estimatedCurrentMonthlyCost,
      marketingStatus: parsed.marketingStatus,
      unsubscribedAt: parsed.unsubscribedAt ? new Date(parsed.unsubscribedAt) : undefined,
      doNotContactReason: parsed.doNotContactReason,
      status: parsed.status,
      source: parsed.source,
      notes: parsed.notes,
      lastContactedAt: parsed.lastContactedAt ? new Date(parsed.lastContactedAt) : undefined,
      lastMarketingEmailAt: parsed.lastMarketingEmailAt ? new Date(parsed.lastMarketingEmailAt) : undefined,
      emailSentCount: parsed.emailSentCount,
      nextFollowUpAt: parsed.nextFollowUpAt ? new Date(`${parsed.nextFollowUpAt}T00:00:00.000Z`) : undefined,
    },
  });

  await prisma.salesLeadEvent.create({
    data: {
      salesLeadId: lead.id,
      eventType: "LEAD_CREATED",
      message: "Sales lead created.",
      metadata: toJson({ source: parsed.source ?? "manual" }),
    },
  });

  return lead;
}

export async function getSalesLeadById(id: string) {
  const parsedId = parseOrThrow(salesLeadIdSchema, id, "sales lead id");
  return prisma.salesLead.findUnique({
    where: { id: parsedId },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function listSalesLeads(options: Partial<ListSalesLeadsInput> = {}) {
  const parsed = parseOrThrow(listSalesLeadsSchema, options, "list sales leads input");
  const query = parsed.search?.toLowerCase();

  return prisma.salesLead.findMany({
    where: {
      status: parsed.status,
      industrySlug: parsed.industrySlug,
      location: parsed.location,
      country: parsed.country,
      cityTown: parsed.cityTown,
      postcode: parsed.postcode,
      serviceArea: parsed.serviceArea,
      leadSource: parsed.leadSource,
      marketingStatus: parsed.marketingStatus,
      ...(query
        ? {
            OR: [
              { businessName: { contains: query, mode: "insensitive" } },
              { contactName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
              { cityTown: { contains: query, mode: "insensitive" } },
              { postcode: { contains: query, mode: "insensitive" } },
              { serviceArea: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
    take: parsed.take,
    skip: parsed.skip,
  });
}

export async function updateSalesLead(input: UpdateSalesLeadInput) {
  const parsed = parseOrThrow(updateSalesLeadSchema, input, "update sales lead input");

  const existing = await prisma.salesLead.findUnique({ where: { id: parsed.id } });
  if (!existing) {
    throw new Error("Sales lead not found");
  }

  const updated = await prisma.salesLead.update({
    where: { id: parsed.id },
    data: {
      businessName: parsed.businessName,
      location: parsed.location,
      country: parsed.country === null ? null : parsed.country,
      cityTown: parsed.cityTown,
      postcode: parsed.postcode,
      address: parsed.address,
      serviceArea: parsed.serviceArea,
      industrySlug: parsed.industrySlug,
      industryLabel: parsed.industryLabel,
      contactName: parsed.contactName,
      email: parsed.email,
      phone: parsed.phone,
      leadSource: parsed.leadSource,
      sourceUrl: parsed.sourceUrl === null ? null : parsed.sourceUrl,
      currentProvider: parsed.currentProvider,
      estimatedCurrentMonthlyCost:
        parsed.estimatedCurrentMonthlyCost === null ? null : parsed.estimatedCurrentMonthlyCost,
      marketingStatus: parsed.marketingStatus,
      unsubscribedAt:
        parsed.unsubscribedAt === null
          ? null
          : parsed.unsubscribedAt
            ? new Date(parsed.unsubscribedAt)
            : undefined,
      doNotContactReason:
        parsed.doNotContactReason === null ? null : parsed.doNotContactReason,
      status: parsed.status,
      source: parsed.source,
      notes: parsed.notes,
      lastContactedAt:
        parsed.lastContactedAt === null
          ? null
          : parsed.lastContactedAt
            ? new Date(parsed.lastContactedAt)
            : undefined,
      lastMarketingEmailAt:
        parsed.lastMarketingEmailAt === null
          ? null
          : parsed.lastMarketingEmailAt
            ? new Date(parsed.lastMarketingEmailAt)
            : undefined,
      emailSentCount: parsed.emailSentCount,
      nextFollowUpAt:
        parsed.nextFollowUpAt === null
          ? null
          : parsed.nextFollowUpAt
            ? new Date(`${parsed.nextFollowUpAt}T00:00:00.000Z`)
            : undefined,
    },
  });

  await prisma.salesLeadEvent.create({
    data: {
      salesLeadId: parsed.id,
      eventType: "LEAD_UPDATED",
      message: "Sales lead updated.",
      metadata: toJson({
        previousStatus: existing.status,
        nextStatus: parsed.status ?? existing.status,
      }),
    },
  });

  return updated;
}

export async function createSalesLeadEvent(input: CreateSalesLeadEventInput) {
  const parsed = parseOrThrow(createSalesLeadEventSchema, input, "create sales lead event input");
  return prisma.salesLeadEvent.create({
    data: {
      salesLeadId: parsed.salesLeadId,
      eventType: parsed.eventType,
      message: parsed.message,
      metadata: parsed.metadata === undefined ? undefined : toJson(parsed.metadata),
    },
  });
}

export async function markSalesLeadContacted(input: MarkSalesLeadContactedInput) {
  const parsed = parseOrThrow(markSalesLeadContactedSchema, input, "mark sales lead contacted input");
  const currentIso = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.salesLead.findUnique({ where: { id: parsed.id } });
    if (!existing) {
      throw new Error("Sales lead not found");
    }

    const updated = await tx.salesLead.update({
      where: { id: parsed.id },
      data: {
        status: parsed.status ?? "CONTACTED",
        lastContactedAt: new Date(currentIso),
        lastMarketingEmailAt: new Date(currentIso),
        emailSentCount: { increment: 1 },
      },
    });

    await tx.salesLeadEvent.create({
      data: {
        salesLeadId: parsed.id,
        eventType: "MARKED_CONTACTED",
        message: parsed.message ?? "Lead marked as contacted.",
        metadata: toJson({
          previousStatus: existing.status,
          nextStatus: updated.status,
          lastContactedAt: currentIso,
        }),
      },
    });

    return updated;
  });
}
