import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  generateSetupConfirmationToken,
  hashSetupConfirmationToken,
  verifySetupConfirmationToken,
} from "@/lib/setup/setup-confirmation-token";
import {
  createDemoDraftSnapshotSchema,
  createSetupRequestEventSchema,
  createSetupRequestSchema,
  listSetupRequestsSchema,
  updateSetupRequestStatusSchema,
} from "@/lib/setup/setup-request-schema";
import {
  CreateDemoDraftSnapshotInput,
  CreateSetupRequestEventInput,
  CreateSetupRequestInput,
  ListSetupRequestsInput,
  UpdateSetupRequestStatusInput,
} from "@/lib/setup/setup-request-types";

const setupRequestIdSchema = z.string().cuid();
const demoDraftSnapshotIdSchema = z.string().cuid();

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

export async function createSetupRequest(input: CreateSetupRequestInput) {
  const parsed = parseOrThrow(createSetupRequestSchema, input, "setup request input");
  const confirmationToken = generateSetupConfirmationToken();
  const confirmationTokenHash = hashSetupConfirmationToken(confirmationToken);

  const setupRequest = await prisma.setupRequest.create({
    data: {
      tenantSiteId: parsed.tenantSiteId,
      demoDraftSnapshotId: parsed.demoDraftSnapshotId,
      confirmationTokenHash,
      confirmationTokenCreatedAt: new Date(),
      industrySlug: parsed.industrySlug,
      businessName: parsed.businessName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone,
      domainOption: parsed.domainOption,
      existingDomain: parsed.existingDomain,
      desiredDomain: parsed.desiredDomain,
      communicationOption: parsed.communicationOption,
      setupTotalGbp: parsed.setupTotalGbp,
      monthlyTotalGbp: parsed.monthlyTotalGbp,
      status: parsed.status,
      paymentStatus: "NOT_STARTED",
      paymentProvider: "STRIPE",
      notes: parsed.notes,
      rawPayload: parsed.rawPayload === undefined ? undefined : toJson(parsed.rawPayload),
    },
  });

  return {
    setupRequest,
    confirmationToken,
  };
}

export async function getSetupRequestById(id: string) {
  const parsedId = parseOrThrow(setupRequestIdSchema, id, "setup request id");

  return prisma.setupRequest.findUnique({
    where: { id: parsedId },
    include: {
      demoDraftSnapshot: true,
      events: { orderBy: { createdAt: "desc" } },
      tenantSite: true,
    },
  });
}

export async function getSetupRequestByIdForConfirmation(id: string, token: string) {
  const parsedId = parseOrThrow(setupRequestIdSchema, id, "setup request id");
  const safeToken = token.trim();
  if (!safeToken) {
    return null;
  }

  const setupRequest = await prisma.setupRequest.findUnique({
    where: { id: parsedId },
    include: {
      demoDraftSnapshot: true,
      events: { orderBy: { createdAt: "desc" } },
      tenantSite: true,
    },
  });

  if (!setupRequest?.confirmationTokenHash) {
    return null;
  }

  if (!verifySetupConfirmationToken(safeToken, setupRequest.confirmationTokenHash)) {
    return null;
  }

  await prisma.setupRequest.update({
    where: { id: parsedId },
    data: {
      confirmationTokenLastUsedAt: new Date(),
      confirmationAccessCount: { increment: 1 },
    },
  });

  return setupRequest;
}

export async function listSetupRequests(options: Partial<ListSetupRequestsInput> = {}) {
  const parsed = parseOrThrow(listSetupRequestsSchema, options, "list setup requests input");

  return prisma.setupRequest.findMany({
    where: {
      tenantSiteId: parsed.tenantSiteId,
      industrySlug: parsed.industrySlug,
      status: parsed.status,
      contactEmail: parsed.contactEmail,
    },
    include: {
      demoDraftSnapshot: true,
      tenantSite: true,
    },
    orderBy: { createdAt: "desc" },
    take: parsed.take,
    skip: parsed.skip,
  });
}

export async function createSetupRequestEvent(input: CreateSetupRequestEventInput) {
  const parsed = parseOrThrow(createSetupRequestEventSchema, input, "setup request event input");

  return prisma.setupRequestEvent.create({
    data: {
      setupRequestId: parsed.setupRequestId,
      eventType: parsed.eventType,
      message: parsed.message,
      metadata: parsed.metadata === undefined ? undefined : toJson(parsed.metadata),
    },
  });
}

export async function updateSetupRequestStatus(input: UpdateSetupRequestStatusInput) {
  const parsed = parseOrThrow(updateSetupRequestStatusSchema, input, "update setup request status input");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.setupRequest.findUnique({
      where: { id: parsed.setupRequestId },
      select: { status: true },
    });

    if (!existing) {
      throw new Error("Setup request not found");
    }

    const updated = await tx.setupRequest.update({
      where: { id: parsed.setupRequestId },
      data: { status: parsed.status },
    });

    await tx.setupRequestEvent.create({
      data: {
        setupRequestId: parsed.setupRequestId,
        eventType: "STATUS_UPDATED",
        message: parsed.message,
        metadata: toJson({
          fromStatus: existing.status,
          toStatus: parsed.status,
          ...(parsed.metadata !== undefined ? { metadata: parsed.metadata } : {}),
        }),
      },
    });

    return updated;
  });
}

export async function markSetupRequestCheckoutStarted(
  setupRequestId: string,
  payload: {
    stripeCheckoutSessionId: string;
    stripeCustomerId?: string;
  },
) {
  const parsedId = parseOrThrow(setupRequestIdSchema, setupRequestId, "setup request id");
  return prisma.setupRequest.update({
    where: { id: parsedId },
    data: {
      paymentStatus: "CHECKOUT_STARTED",
      paymentProvider: "STRIPE",
      stripeCheckoutSessionId: payload.stripeCheckoutSessionId,
      stripeCustomerId: payload.stripeCustomerId,
      paymentStartedAt: new Date(),
    },
  });
}

export async function markSetupRequestPaidByCheckout(input: {
  setupRequestId: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const parsedId = parseOrThrow(setupRequestIdSchema, input.setupRequestId, "setup request id");
  return prisma.setupRequest.update({
    where: { id: parsedId },
    data: {
      paymentStatus: "PAID",
      paymentProvider: "STRIPE",
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      paymentCompletedAt: new Date(),
      status: "SITE_PROVISIONING",
    },
  });
}

export async function markSetupRequestPaymentFailedBySubscriptionId(
  stripeSubscriptionId: string,
) {
  if (!stripeSubscriptionId) {
    return null;
  }

  const existing = await prisma.setupRequest.findFirst({
    where: { stripeSubscriptionId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.setupRequest.update({
    where: { id: existing.id },
    data: {
      paymentStatus: "PAYMENT_FAILED",
      paymentProvider: "STRIPE",
    },
  });
}

export async function createDemoDraftSnapshot(input: CreateDemoDraftSnapshotInput) {
  const parsed = parseOrThrow(createDemoDraftSnapshotSchema, input, "demo draft snapshot input");

  return prisma.demoDraftSnapshot.create({
    data: {
      tenantSiteId: parsed.tenantSiteId,
      setupRequestId: parsed.setupRequestId,
      templateSlug: parsed.templateSlug,
      draftName: parsed.draftName,
      draftJson: toJson(parsed.draftJson),
      source: parsed.source,
    },
  });
}

export async function attachDemoDraftSnapshotToSetupRequest(
  setupRequestId: string,
  demoDraftSnapshotId: string,
) {
  const parsedSetupRequestId = parseOrThrow(setupRequestIdSchema, setupRequestId, "setup request id");
  const parsedDemoDraftSnapshotId = parseOrThrow(
    demoDraftSnapshotIdSchema,
    demoDraftSnapshotId,
    "demo draft snapshot id",
  );

  return prisma.$transaction(async (tx) => {
    await tx.setupRequest.update({
      where: { id: parsedSetupRequestId },
      data: { demoDraftSnapshotId: parsedDemoDraftSnapshotId },
    });

    const snapshot = await tx.demoDraftSnapshot.update({
      where: { id: parsedDemoDraftSnapshotId },
      data: { setupRequestId: parsedSetupRequestId },
    });

    await tx.setupRequestEvent.create({
      data: {
        setupRequestId: parsedSetupRequestId,
        eventType: "DEMO_DRAFT_ATTACHED",
        message: "Demo draft snapshot attached to setup request.",
        metadata: toJson({ demoDraftSnapshotId: parsedDemoDraftSnapshotId }),
      },
    });

    return snapshot;
  });
}
