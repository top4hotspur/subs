import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  createOrUpdateSiteDomainSchema,
  createSiteStatusEventSchema,
  createTenantSiteFromSetupRequestSchema,
  listTenantSitesSchema,
  updateProvisioningTaskStatusSchema,
  updateTenantSiteStatusSchema,
} from "@/lib/sites/site-provisioning-schema";
import {
  CreateOrUpdateSiteDomainInput,
  CreateSiteStatusEventInput,
  CreateTenantSiteFromSetupRequestInput,
  ListTenantSitesInput,
  UpdateProvisioningTaskStatusInput,
  UpdateTenantSiteStatusInput,
} from "@/lib/sites/site-provisioning-types";

const cuid = z.string().cuid();

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

function slugify(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function normalizeSiteDomainInput(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//i, "");
  const withoutPath = withoutProtocol.split(/[/?#]/)[0] ?? "";
  const withoutPort = withoutPath.split(":")[0] ?? "";
  return withoutPort.replace(/\.$/, "").trim();
}

function isDomainLike(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value);
}

async function buildUniqueSlug(base: string): Promise<string> {
  const slugBase = slugify(base) || "site";
  let candidate = slugBase;
  let index = 1;

  while (true) {
    const existing = await prisma.tenantSite.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${slugBase}-${index}`;
    index += 1;
  }
}

function buildDefaultTasks() {
  return [
    { taskType: "REVIEW_SETUP", title: "Review setup request" },
    { taskType: "CONFIRM_BUSINESS", title: "Confirm business details" },
    { taskType: "CONFIRM_DOMAIN_OPTION", title: "Confirm domain option" },
    { taskType: "CONFIRM_SUBSCRIPTION", title: "Confirm payment/subscription status" },
    { taskType: "PREPARE_SITE_SETTINGS", title: "Prepare clean subscriber site settings" },
    { taskType: "PREPARE_DNS", title: "Prepare domain/DNS instructions" },
    { taskType: "MARK_READY", title: "Mark site ready" },
    { taskType: "MARK_LIVE", title: "Mark site live" },
  ] as const;
}

export async function createTenantSiteFromSetupRequest(input: CreateTenantSiteFromSetupRequestInput) {
  const parsed = parseOrThrow(
    createTenantSiteFromSetupRequestSchema,
    input,
    "create tenant site from setup request input",
  );

  return prisma.$transaction(async (tx) => {
    const setupRequest = await tx.setupRequest.findUnique({
      where: { id: parsed.setupRequestId },
      include: { tenantSite: true, demoDraftSnapshot: true },
    });

    if (!setupRequest) {
      throw new Error("Setup request not found");
    }

    if (setupRequest.tenantSiteId && setupRequest.tenantSite) {
      return { tenantSite: setupRequest.tenantSite, created: false };
    }

    const existingByOrigin = await tx.tenantSite.findUnique({
      where: { setupRequestId: setupRequest.id },
    });
    if (existingByOrigin) {
      if (!setupRequest.tenantSiteId) {
        await tx.setupRequest.update({
          where: { id: setupRequest.id },
          data: { tenantSiteId: existingByOrigin.id },
        });
      }
      return { tenantSite: existingByOrigin, created: false };
    }

    const slug = await buildUniqueSlug(setupRequest.businessName);
    const whatsappAddonEnabled =
      setupRequest.communicationOption === "EMAIL_AND_WHATSAPP";

    const tenantSite = await tx.tenantSite.create({
      data: {
        slug,
        displayName: setupRequest.businessName,
        industrySlug: setupRequest.industrySlug,
        status: "SETUP_REQUESTED",
        setupRequestId: setupRequest.id,
        provisioningStatus: "SETUP_REQUESTED",
        subscriptionStatus: "PENDING",
        domainStatus: "NOT_STARTED",
        whatsappAddonEnabled,
      },
    });

    await tx.setupRequest.update({
      where: { id: setupRequest.id },
      data: { tenantSiteId: tenantSite.id },
    });

    await tx.subscriptionRecord.create({
      data: {
        tenantSiteId: tenantSite.id,
        status: "PENDING",
        setupFeeGbp: setupRequest.setupTotalGbp,
        monthlyFeeGbp: setupRequest.monthlyTotalGbp,
        domainFeeGbp: setupRequest.domainOption === "WE_REGISTER_DOMAIN" ? 49 : 0,
        whatsappAddonEnabled,
      },
    });

    const domainValue = setupRequest.existingDomain || setupRequest.desiredDomain;
    if (domainValue) {
      await tx.siteDomain.create({
        data: {
          tenantSiteId: tenantSite.id,
          domain: domainValue,
          domainType: "PRIMARY",
          status: "DETAILS_NEEDED",
          registrarNotes: "Created from setup request",
        },
      });

      await tx.tenantSite.update({
        where: { id: tenantSite.id },
        data: { domainPrimary: domainValue, domainStatus: "DETAILS_NEEDED" },
      });
    }

    await tx.siteProvisioningTask.createMany({
      data: buildDefaultTasks().map((task) => ({
        tenantSiteId: tenantSite.id,
        setupRequestId: setupRequest.id,
        taskType: task.taskType,
        title: task.title,
        status: "TODO",
      })),
    });

    await tx.siteStatusEvent.create({
      data: {
        tenantSiteId: tenantSite.id,
        eventType: "SITE_SETUP_STARTED",
        message: "Tenant site created from setup request.",
        metadata: toJson({ setupRequestId: setupRequest.id }),
      },
    });

    return { tenantSite, created: true };
  });
}

export async function getTenantSiteById(id: string) {
  const parsedId = parseOrThrow(cuid, id, "tenant site id");
  return prisma.tenantSite.findUnique({
    where: { id: parsedId },
    include: {
      siteDomains: true,
      provisioningTasks: { orderBy: { createdAt: "asc" } },
      statusEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      setupRequest: true,
    },
  });
}

export async function getTenantSiteBySetupRequestId(setupRequestId: string) {
  const parsedId = parseOrThrow(cuid, setupRequestId, "setup request id");
  return prisma.tenantSite.findUnique({
    where: { setupRequestId: parsedId },
    include: {
      siteDomains: true,
      provisioningTasks: { orderBy: { createdAt: "asc" } },
      statusEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      setupRequest: true,
    },
  });
}

export async function listTenantSites(options: Partial<ListTenantSitesInput> = {}) {
  const parsed = parseOrThrow(listTenantSitesSchema, options, "list tenant sites input");
  return prisma.tenantSite.findMany({
    where: {
      industrySlug: parsed.industrySlug,
      provisioningStatus: parsed.provisioningStatus,
    },
    include: {
      siteDomains: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      setupRequest: true,
    },
    orderBy: { createdAt: "desc" },
    take: parsed.take,
    skip: parsed.skip,
  });
}

export async function updateTenantSiteProvisioningStatus(input: UpdateTenantSiteStatusInput) {
  const parsed = parseOrThrow(updateTenantSiteStatusSchema, input, "update tenant site status input");
  return prisma.tenantSite.update({
    where: { id: parsed.tenantSiteId },
    data: {
      status: parsed.status,
      provisioningStatus: parsed.provisioningStatus,
      subscriptionStatus: parsed.subscriptionStatus,
      domainStatus: parsed.domainStatus,
      domainPrimary: parsed.domainPrimary,
      whatsappAddonEnabled: parsed.whatsappAddonEnabled,
    },
  });
}

export async function createSiteDomain(input: CreateOrUpdateSiteDomainInput) {
  const parsed = parseOrThrow(createOrUpdateSiteDomainSchema, input, "create/update site domain input");
  const normalizedDomain = normalizeSiteDomainInput(parsed.domain);
  if (!isDomainLike(normalizedDomain)) {
    throw new Error("SITE_DOMAIN_INVALID");
  }

  const duplicate = await prisma.siteDomain.findFirst({
    where: {
      domain: normalizedDomain,
      tenantSiteId: { not: parsed.tenantSiteId },
      status: { notIn: ["CANCELLED", "SUSPENDED", "FAILED"] },
    },
    select: { id: true, tenantSiteId: true },
  });
  if (duplicate) {
    throw new Error("SITE_DOMAIN_ALREADY_ASSIGNED");
  }

  const record = await prisma.siteDomain.upsert({
    where: {
      tenantSiteId_domain_domainType: {
        tenantSiteId: parsed.tenantSiteId,
        domain: normalizedDomain,
        domainType: parsed.domainType,
      },
    },
    create: {
      tenantSiteId: parsed.tenantSiteId,
      domain: normalizedDomain,
      domainType: parsed.domainType,
      status: parsed.status,
      registrarNotes: parsed.registrarNotes,
      dnsInstructions: parsed.dnsInstructions === undefined ? undefined : toJson(parsed.dnsInstructions),
    },
    update: {
      status: parsed.status,
      registrarNotes: parsed.registrarNotes,
      dnsInstructions: parsed.dnsInstructions === undefined ? undefined : toJson(parsed.dnsInstructions),
    },
  });

  if (parsed.domainType === "PRIMARY") {
    await prisma.tenantSite.update({
      where: { id: parsed.tenantSiteId },
      data: {
        domainPrimary: normalizedDomain,
        domainStatus: parsed.status,
      },
    });
  }

  await createSiteStatusEvent({
    tenantSiteId: parsed.tenantSiteId,
    eventType: "SITE_DOMAIN_UPDATED",
    message: `SiteDomain ${normalizedDomain} saved as ${parsed.domainType}.`,
    metadata: {
      domain: normalizedDomain,
      domainType: parsed.domainType,
      status: parsed.status,
    },
  });

  return record;
}

export async function listSiteDomains(tenantSiteId: string) {
  const parsedId = parseOrThrow(cuid, tenantSiteId, "tenant site id");
  return prisma.siteDomain.findMany({
    where: { tenantSiteId: parsedId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createDefaultProvisioningTasks(tenantSiteId: string, setupRequestId?: string) {
  const parsedTenantSiteId = parseOrThrow(cuid, tenantSiteId, "tenant site id");
  const parsedSetupRequestId = setupRequestId ? parseOrThrow(cuid, setupRequestId, "setup request id") : undefined;
  await prisma.siteProvisioningTask.createMany({
    data: buildDefaultTasks().map((task) => ({
      tenantSiteId: parsedTenantSiteId,
      setupRequestId: parsedSetupRequestId,
      taskType: task.taskType,
      title: task.title,
      status: "TODO",
    })),
  });
  return listProvisioningTasks(parsedTenantSiteId);
}

export async function listProvisioningTasks(tenantSiteId: string) {
  const parsedId = parseOrThrow(cuid, tenantSiteId, "tenant site id");
  return prisma.siteProvisioningTask.findMany({
    where: { tenantSiteId: parsedId },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateProvisioningTaskStatus(input: UpdateProvisioningTaskStatusInput) {
  const parsed = parseOrThrow(
    updateProvisioningTaskStatusSchema,
    input,
    "update provisioning task status input",
  );
  return prisma.siteProvisioningTask.update({
    where: { id: parsed.taskId },
    data: {
      status: parsed.status,
      notes: parsed.notes,
      metadata: parsed.metadata === undefined ? undefined : toJson(parsed.metadata),
    },
  });
}

export async function createSiteStatusEvent(input: CreateSiteStatusEventInput) {
  const parsed = parseOrThrow(createSiteStatusEventSchema, input, "create site status event input");
  return prisma.siteStatusEvent.create({
    data: {
      tenantSiteId: parsed.tenantSiteId,
      eventType: parsed.eventType,
      message: parsed.message,
      metadata: parsed.metadata === undefined ? undefined : toJson(parsed.metadata),
    },
  });
}

export async function createSubscriptionPlaceholderFromSetupRequest(
  tenantSiteId: string,
  setupRequestId: string,
) {
  const parsedTenantSiteId = parseOrThrow(cuid, tenantSiteId, "tenant site id");
  const parsedSetupRequestId = parseOrThrow(cuid, setupRequestId, "setup request id");

  const setupRequest = await prisma.setupRequest.findUnique({
    where: { id: parsedSetupRequestId },
  });
  if (!setupRequest) {
    throw new Error("Setup request not found");
  }

  const whatsappAddonEnabled =
    setupRequest.communicationOption === "EMAIL_AND_WHATSAPP";

  return prisma.subscriptionRecord.create({
    data: {
      tenantSiteId: parsedTenantSiteId,
      status: "PENDING",
      setupFeeGbp: setupRequest.setupTotalGbp,
      monthlyFeeGbp: setupRequest.monthlyTotalGbp,
      domainFeeGbp: setupRequest.domainOption === "WE_REGISTER_DOMAIN" ? 49 : 0,
      whatsappAddonEnabled,
    },
  });
}
