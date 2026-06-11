import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { extractVisibleBooksyListings } from "@/lib/sales/booksy-lead-extractor";
import { extractLeadImportRow } from "@/lib/sales/lead-import-extractor";
import { createSalesLead } from "@/lib/sales/sales-lead-repository";
import {
  approveSalesLeadImportRowsSchema,
  createSalesLeadImportBatchSchema,
  importBatchIdSchema,
  importRowIdSchema,
  updateSalesLeadImportRowSchema,
} from "@/lib/sales/sales-lead-import-schema";

type CreateSalesLeadImportBatchInput = z.infer<typeof createSalesLeadImportBatchSchema>;
type UpdateSalesLeadImportRowInput = z.infer<typeof updateSalesLeadImportRowSchema>;
type ApproveSalesLeadImportRowsInput = z.infer<typeof approveSalesLeadImportRowsSchema>;

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

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
}

async function findDuplicateReason(row: {
  extractedBusinessName?: string | null;
  extractedPostcode?: string | null;
  extractedEmail?: string | null;
  extractedPhone?: string | null;
  industrySlug?: string | null;
  sourceUrl?: string | null;
}) {
  const postcode = normalize(row.extractedPostcode);
  const industrySlug = normalize(row.industrySlug);
  const businessName = normalize(row.extractedBusinessName);
  const email = normalize(row.extractedEmail);
  const phone = normalize(row.extractedPhone);
  const sourceUrl = normalize(row.sourceUrl);
  const reasons: string[] = [];

  if (postcode && industrySlug) {
    const match = await prisma.salesLead.findFirst({
      where: { postcode: { equals: postcode, mode: "insensitive" }, industrySlug: { equals: industrySlug, mode: "insensitive" } },
      select: { businessName: true },
    });
    if (match) reasons.push(`postcode + industry matches ${match.businessName}`);
  }
  if (businessName && postcode) {
    const match = await prisma.salesLead.findFirst({
      where: {
        businessName: { equals: businessName, mode: "insensitive" },
        postcode: { equals: postcode, mode: "insensitive" },
      },
      select: { businessName: true },
    });
    if (match) reasons.push(`business name + postcode matches ${match.businessName}`);
  }
  if (email) {
    const match = await prisma.salesLead.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { businessName: true },
    });
    if (match) reasons.push(`email matches ${match.businessName}`);
  }
  if (phone) {
    const match = await prisma.salesLead.findFirst({
      where: { phone },
      select: { businessName: true },
    });
    if (match) reasons.push(`phone matches ${match.businessName}`);
  }
  if (sourceUrl) {
    const match = await prisma.salesLead.findFirst({
      where: { sourceUrl: { equals: sourceUrl, mode: "insensitive" } },
      select: { businessName: true },
    });
    if (match) reasons.push(`source URL matches ${match.businessName}`);
  }

  return reasons.join("; ") || undefined;
}

function isBooksyUrl(sourceUrl: string, sourceType?: string | null): boolean {
  if (sourceType === "Booksy") return true;
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    return host === "booksy.com" || host.endsWith(".booksy.com") || host === "booksy.net" || host.endsWith(".booksy.net") || host === "booksy.co.uk" || host.endsWith(".booksy.co.uk");
  } catch {
    return false;
  }
}

async function createImportRow(batchId: string, extracted: ReturnType<typeof extractLeadImportRow>) {
  const duplicateReason = await findDuplicateReason(extracted);

  return prisma.salesLeadImportRow.create({
    data: {
      batchId,
      sourceUrl: extracted.sourceUrl,
      extractedBusinessName: extracted.extractedBusinessName,
      extractedAddress: extracted.extractedAddress,
      extractedPostcode: extracted.extractedPostcode,
      extractedPhone: extracted.extractedPhone,
      extractedWebsite: extracted.extractedWebsite,
      extractedEmail: extracted.extractedEmail,
      leadSource: extracted.leadSource,
      currentProvider: extracted.currentProvider,
      estimatedCurrentMonthlyCost: extracted.estimatedCurrentMonthlyCost,
      industrySlug: extracted.industrySlug,
      cityTown: extracted.cityTown,
      status: duplicateReason ? "DUPLICATE" : extracted.status,
      emailEnrichmentStatus: extracted.emailEnrichmentStatus,
      duplicateReason,
      notes: extracted.notes,
      raw: toJson(extracted.raw),
    },
  });
}

export async function listSalesLeadImportBatches() {
  return prisma.salesLeadImportBatch.findMany({
    include: { rows: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getSalesLeadImportBatch(id: string) {
  const parsedId = parseOrThrow(importBatchIdSchema, id, "sales lead import batch id");
  return prisma.salesLeadImportBatch.findUnique({
    where: { id: parsedId },
    include: { rows: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createSalesLeadImportBatch(input: CreateSalesLeadImportBatchInput) {
  const parsed = parseOrThrow(createSalesLeadImportBatchSchema, input, "sales lead import batch input");
  const uniqueUrls = [...new Set(parsed.sourceUrls.map((url) => url.trim()).filter(Boolean))];

  const batch = await prisma.salesLeadImportBatch.create({
    data: {
      sourceType: parsed.sourceType,
      defaultIndustrySlug: parsed.defaultIndustrySlug,
      defaultCityTown: parsed.defaultCityTown,
      status: "PREVIEW",
    },
  });

  for (const sourceUrl of uniqueUrls) {
    if (isBooksyUrl(sourceUrl, parsed.sourceType)) {
      const booksyResult = await extractVisibleBooksyListings({
        sourceUrl,
        defaultIndustrySlug: parsed.defaultIndustrySlug,
        defaultCityTown: parsed.defaultCityTown,
      });
      if (booksyResult.rows.length > 0) {
        for (const row of booksyResult.rows) {
          await createImportRow(batch.id, row);
        }
        continue;
      }
      const fallback = extractLeadImportRow({
        sourceUrl,
        sourceType: "Booksy",
        defaultIndustrySlug: parsed.defaultIndustrySlug,
        defaultCityTown: parsed.defaultCityTown,
      });
      await createImportRow(batch.id, {
        ...fallback,
        status: "NEEDS_ENRICHMENT",
        notes: [
          "Could not extract visible listings from this URL. A placeholder row has been created for manual review.",
          booksyResult.fallbackReason,
        ].filter(Boolean).join("\n"),
        raw: {
          ...fallback.raw,
          strategy: "booksy-public-html-fallback",
          fetchedUrl: booksyResult.fetchedUrl,
          fallbackReason: booksyResult.fallbackReason,
          extractedCount: 0,
          sponsoredSkippedCount: booksyResult.sponsoredSkippedCount,
        },
      });
      continue;
    }

    await createImportRow(batch.id, extractLeadImportRow({
      sourceUrl,
      sourceType: parsed.sourceType,
      defaultIndustrySlug: parsed.defaultIndustrySlug,
      defaultCityTown: parsed.defaultCityTown,
    }));
  }

  return getSalesLeadImportBatch(batch.id);
}

export async function updateSalesLeadImportRow(input: UpdateSalesLeadImportRowInput) {
  const parsed = parseOrThrow(updateSalesLeadImportRowSchema, input, "sales lead import row input");
  const existing = await prisma.salesLeadImportRow.findUnique({ where: { id: parsed.id } });
  if (!existing) throw new Error("Sales lead import row not found");
  const merged = {
    extractedBusinessName: parsed.extractedBusinessName === undefined ? existing.extractedBusinessName : parsed.extractedBusinessName,
    extractedPostcode: parsed.extractedPostcode === undefined ? existing.extractedPostcode : parsed.extractedPostcode,
    extractedEmail: parsed.extractedEmail === undefined ? existing.extractedEmail : parsed.extractedEmail,
    extractedPhone: parsed.extractedPhone === undefined ? existing.extractedPhone : parsed.extractedPhone,
    industrySlug: parsed.industrySlug === undefined ? existing.industrySlug : parsed.industrySlug,
    sourceUrl: existing.sourceUrl,
  };
  const duplicateReason =
    parsed.status === "SKIPPED" || parsed.status === "APPROVED"
      ? parsed.duplicateReason
      : await findDuplicateReason(merged);

  return prisma.salesLeadImportRow.update({
    where: { id: parsed.id },
    data: {
      extractedBusinessName: parsed.extractedBusinessName === null ? null : parsed.extractedBusinessName,
      extractedAddress: parsed.extractedAddress === null ? null : parsed.extractedAddress,
      extractedPostcode: parsed.extractedPostcode === null ? null : parsed.extractedPostcode,
      extractedPhone: parsed.extractedPhone === null ? null : parsed.extractedPhone,
      extractedWebsite: parsed.extractedWebsite === null ? null : parsed.extractedWebsite,
      extractedEmail: parsed.extractedEmail === null ? null : parsed.extractedEmail,
      leadSource: parsed.leadSource === null ? null : parsed.leadSource,
      currentProvider: parsed.currentProvider === null ? null : parsed.currentProvider,
      estimatedCurrentMonthlyCost:
        parsed.estimatedCurrentMonthlyCost === null ? null : parsed.estimatedCurrentMonthlyCost,
      industrySlug: parsed.industrySlug === null ? null : parsed.industrySlug,
      cityTown: parsed.cityTown === null ? null : parsed.cityTown,
      status: parsed.status ?? (duplicateReason ? "DUPLICATE" : undefined),
      emailEnrichmentStatus: parsed.emailEnrichmentStatus,
      duplicateReason: duplicateReason === null ? null : duplicateReason,
      notes: parsed.notes === null ? null : parsed.notes,
    },
  });
}

export async function approveSalesLeadImportRows(batchId: string, input: ApproveSalesLeadImportRowsInput) {
  const parsedBatchId = parseOrThrow(importBatchIdSchema, batchId, "sales lead import batch id");
  const parsed = parseOrThrow(approveSalesLeadImportRowsSchema, input, "approve sales lead import rows input");
  const rows = await prisma.salesLeadImportRow.findMany({
    where: { batchId: parsedBatchId, id: { in: parsed.rowIds } },
    orderBy: { createdAt: "asc" },
  });
  const approvedLeadIds: string[] = [];
  const skipped: Array<{ rowId: string; reason: string }> = [];

  for (const row of rows) {
    if (row.status === "APPROVED") {
      skipped.push({ rowId: row.id, reason: "already approved" });
      continue;
    }
    if (row.status === "SKIPPED") {
      skipped.push({ rowId: row.id, reason: "row skipped" });
      continue;
    }
    if (row.duplicateReason && !parsed.approveDuplicates) {
      skipped.push({ rowId: row.id, reason: row.duplicateReason });
      continue;
    }
    if (!row.extractedBusinessName) {
      skipped.push({ rowId: row.id, reason: "missing business name" });
      continue;
    }

    const notes = [
      row.notes,
      row.extractedWebsite ? `Website: ${row.extractedWebsite}` : undefined,
      !row.extractedEmail ? "Needs email research before email outreach." : undefined,
      row.duplicateReason ? `Approved despite duplicate warning: ${row.duplicateReason}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    const lead = await createSalesLead({
      businessName: row.extractedBusinessName,
      cityTown: row.cityTown ?? undefined,
      postcode: row.extractedPostcode ?? undefined,
      address: row.extractedAddress ?? undefined,
      location: row.extractedAddress ?? undefined,
      industrySlug: row.industrySlug ?? undefined,
      email: row.extractedEmail ?? undefined,
      phone: row.extractedPhone ?? undefined,
      leadSource: row.leadSource ?? undefined,
      sourceUrl: row.sourceUrl,
      currentProvider: row.currentProvider ?? undefined,
      estimatedCurrentMonthlyCost: row.estimatedCurrentMonthlyCost
        ? Number(row.estimatedCurrentMonthlyCost)
        : undefined,
      marketingStatus: row.emailEnrichmentStatus === "Do not contact" ? "DO_NOT_CONTACT" : "ACTIVE",
      doNotContactReason: row.emailEnrichmentStatus === "Do not contact" ? "Import row marked do not contact." : undefined,
      status: row.extractedEmail ? "NEW" : "FOLLOW_UP",
      source: "url-import",
      notes: notes || undefined,
    });

    await prisma.salesLeadImportRow.update({
      where: { id: row.id },
      data: {
        status: "APPROVED",
        approvedLeadId: lead.id,
        approvedAt: new Date(),
        emailEnrichmentStatus: row.extractedEmail ? "Email found" : "Needs manual research",
      },
    });
    approvedLeadIds.push(lead.id);
  }

  const batch = await getSalesLeadImportBatch(parsedBatchId);
  return { batch, approvedLeadIds, skipped };
}

export async function markSalesLeadImportRowForEmailResearch(rowId: string) {
  const parsedRowId = parseOrThrow(importRowIdSchema, rowId, "sales lead import row id");
  return prisma.salesLeadImportRow.update({
    where: { id: parsedRowId },
    data: {
      status: "NEEDS_ENRICHMENT",
      emailEnrichmentStatus: "Needs manual research",
    },
  });
}
