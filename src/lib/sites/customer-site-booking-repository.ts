import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  createCustomerSiteBookingSchema,
  listCustomerSiteBookingsSchema,
  updateCustomerSiteBookingStatusSchema,
} from "@/lib/sites/customer-site-booking-schema";
import type {
  CustomerSiteBookingListOptions,
  CustomerSiteBookingRecord,
} from "@/lib/sites/customer-site-booking-types";

const tenantSiteIdSchema = z.object({
  tenantSiteId: z.string().cuid(),
});

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

function serializeBooking(record: {
  id: string;
  tenantSiteId: string;
  serviceId: string | null;
  serviceName: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  staffMemberId: string | null;
  staffName: string | null;
  status: string;
  paymentStatus: string | null;
  notes: string | null;
  source: string | null;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteBookingRecord {
  return {
    ...record,
    status: record.status as CustomerSiteBookingRecord["status"],
    paymentStatus: record.paymentStatus as CustomerSiteBookingRecord["paymentStatus"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function assertTenantService(tenantSiteId: string, serviceId?: string): Promise<void> {
  if (!serviceId) return;
  const row = await prisma.customerSiteService.findFirst({
    where: { id: serviceId, tenantSiteId },
    select: { id: true },
  });
  if (!row) throw new Error("Invalid service for tenant site");
}

async function assertTenantStaff(tenantSiteId: string, staffMemberId?: string): Promise<void> {
  if (!staffMemberId) return;
  const row = await prisma.customerSiteStaffMember.findFirst({
    where: { id: staffMemberId, tenantSiteId },
    select: { id: true, displayName: true },
  });
  if (!row) throw new Error("Invalid staff member for tenant site");
}

async function assertNoActiveSlotConflict(
  tenantSiteId: string,
  preferredDate?: string,
  preferredTime?: string,
  staffMemberId?: string,
): Promise<void> {
  if (!preferredDate || !preferredTime || !staffMemberId) return;
  const existing = await prisma.customerSiteBooking.findFirst({
    where: {
      tenantSiteId,
      preferredDate,
      preferredTime,
      staffMemberId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("BOOKING_SLOT_CONFLICT");
  }
}

export async function createCustomerSiteBooking(
  tenantSiteId: string,
  input: z.infer<typeof createCustomerSiteBookingSchema>,
): Promise<CustomerSiteBookingRecord> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsed = parseOrThrow(createCustomerSiteBookingSchema, input, "customer site booking");

  await assertTenantService(parsedTenant.tenantSiteId, parsed.serviceId);
  await assertTenantStaff(parsedTenant.tenantSiteId, parsed.staffMemberId);
  await assertNoActiveSlotConflict(
    parsedTenant.tenantSiteId,
    parsed.preferredDate,
    parsed.preferredTime,
    parsed.staffMemberId,
  );

  const staffName = parsed.staffMemberId
    ? (
        await prisma.customerSiteStaffMember.findFirst({
          where: { id: parsed.staffMemberId, tenantSiteId: parsedTenant.tenantSiteId },
          select: { displayName: true },
        })
      )?.displayName ?? parsed.staffName ?? null
    : parsed.staffName ?? null;

  const serviceName = parsed.serviceId
    ? (
        await prisma.customerSiteService.findFirst({
          where: { id: parsed.serviceId, tenantSiteId: parsedTenant.tenantSiteId },
          select: { name: true },
        })
      )?.name ?? parsed.serviceName ?? null
    : parsed.serviceName ?? null;

  const row = await prisma.customerSiteBooking.create({
    data: {
      tenantSiteId: parsedTenant.tenantSiteId,
      serviceId: parsed.serviceId ?? null,
      serviceName,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail ?? null,
      customerPhone: parsed.customerPhone ?? null,
      preferredDate: parsed.preferredDate ?? null,
      preferredTime: parsed.preferredTime ?? null,
      staffMemberId: parsed.staffMemberId ?? null,
      staffName,
      status: parsed.status,
      paymentStatus: parsed.paymentStatus ?? "PAYMENT_REQUIRED",
      notes: parsed.notes ?? null,
      source: parsed.source ?? "preview",
      rawPayload:
        parsed.rawPayload === undefined
          ? undefined
          : (parsed.rawPayload as Prisma.InputJsonValue),
    },
  });

  return serializeBooking(row);
}

export async function getCustomerSiteBookingById(
  tenantSiteId: string,
  bookingId: string,
): Promise<CustomerSiteBookingRecord | null> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const id = parseOrThrow(z.string().cuid(), bookingId, "booking id");
  const row = await prisma.customerSiteBooking.findFirst({
    where: { id, tenantSiteId: parsedTenant.tenantSiteId },
  });
  return row ? serializeBooking(row) : null;
}

export async function listCustomerSiteBookings(
  tenantSiteId: string,
  options: Partial<CustomerSiteBookingListOptions> = {},
): Promise<CustomerSiteBookingRecord[]> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsedOptions = parseOrThrow(listCustomerSiteBookingsSchema, options, "list bookings options");

  const rows = await prisma.customerSiteBooking.findMany({
    where: {
      tenantSiteId: parsedTenant.tenantSiteId,
      status: parsedOptions.status,
      preferredDate: parsedOptions.preferredDate,
    },
    orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }, { createdAt: "desc" }],
    take: parsedOptions.take,
    skip: parsedOptions.skip,
  });
  return rows.map(serializeBooking);
}

export async function updateCustomerSiteBookingStatus(
  tenantSiteId: string,
  input: z.infer<typeof updateCustomerSiteBookingStatusSchema>,
): Promise<CustomerSiteBookingRecord> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsed = parseOrThrow(
    updateCustomerSiteBookingStatusSchema,
    input,
    "update booking status",
  );

  const row = await prisma.customerSiteBooking.updateMany({
    where: { id: parsed.bookingId, tenantSiteId: parsedTenant.tenantSiteId },
    data: {
      status: parsed.status,
      paymentStatus: parsed.paymentStatus ?? undefined,
      notes: parsed.notes ?? undefined,
    },
  });
  if (row.count === 0) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const found = await prisma.customerSiteBooking.findUnique({ where: { id: parsed.bookingId } });
  if (!found) throw new Error("BOOKING_NOT_FOUND");
  return serializeBooking(found);
}
