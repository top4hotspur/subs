import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  amendCustomerSiteBookingSchema,
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

function toUtcDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
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
  startDateTime: Date | null;
  endDateTime: Date | null;
  staffMemberId: string | null;
  staffName: string | null;
  status: string;
  paymentStatus: string | null;
  notes: string | null;
  policyAcceptedAt: Date | null;
  source: string | null;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteBookingRecord {
  return {
    ...record,
    status: record.status as CustomerSiteBookingRecord["status"],
    paymentStatus: record.paymentStatus as CustomerSiteBookingRecord["paymentStatus"],
    startDateTime: record.startDateTime?.toISOString() ?? null,
    endDateTime: record.endDateTime?.toISOString() ?? null,
    policyAcceptedAt: record.policyAcceptedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getTenantService(tenantSiteId: string, serviceId: string) {
  const row = await prisma.customerSiteService.findFirst({
    where: { id: serviceId, tenantSiteId },
    select: { id: true, name: true, active: true, durationMinutes: true },
  });
  if (!row) throw new Error("Invalid service for tenant site");
  if (!row.active || !row.durationMinutes || row.durationMinutes <= 0) {
    throw new Error("BOOKING_SERVICE_UNAVAILABLE");
  }
  return { ...row, durationMinutes: row.durationMinutes };
}

async function getTenantStaffName(tenantSiteId: string, staffMemberId?: string | null): Promise<string | null> {
  if (!staffMemberId) return null;
  const row = await prisma.customerSiteStaffMember.findFirst({
    where: { id: staffMemberId, tenantSiteId, active: true },
    select: { displayName: true },
  });
  if (!row) throw new Error("Invalid staff member for tenant site");
  return row.displayName;
}

async function assertTenantStaff(tenantSiteId: string, staffMemberId?: string): Promise<void> {
  if (!staffMemberId) return;
  const row = await prisma.customerSiteStaffMember.findFirst({
    where: { id: staffMemberId, tenantSiteId, active: true },
    select: { id: true },
  });
  if (!row) throw new Error("Invalid staff member for tenant site");
}

export async function createCustomerSiteBooking(
  tenantSiteId: string,
  input: z.infer<typeof createCustomerSiteBookingSchema>,
): Promise<CustomerSiteBookingRecord> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsed = parseOrThrow(createCustomerSiteBookingSchema, input, "customer site booking");

  const service = await getTenantService(parsedTenant.tenantSiteId, parsed.serviceId);
  const serviceDuration = service.durationMinutes;
  await assertTenantStaff(parsedTenant.tenantSiteId, parsed.staffMemberId);

  const staffName = parsed.staffMemberId
    ? (
        await prisma.customerSiteStaffMember.findFirst({
          where: { id: parsed.staffMemberId, tenantSiteId: parsedTenant.tenantSiteId },
          select: { displayName: true },
        })
      )?.displayName ?? parsed.staffName ?? null
    : parsed.staffName ?? null;

  const startDateTime = toUtcDateTime(parsed.preferredDate, parsed.preferredTime);
  const endDateTime = new Date(startDateTime.getTime() + serviceDuration * 60 * 1000);

  const row = await prisma.customerSiteBooking.create({
    data: {
      tenantSiteId: parsedTenant.tenantSiteId,
      serviceId: parsed.serviceId,
      serviceName: service.name ?? parsed.serviceName ?? null,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      preferredDate: parsed.preferredDate,
      preferredTime: parsed.preferredTime,
      startDateTime,
      endDateTime,
      staffMemberId: parsed.staffMemberId ?? null,
      staffName,
      status: parsed.status,
      paymentStatus: parsed.paymentStatus ?? "NOT_REQUIRED",
      notes: parsed.notes ?? null,
      policyAcceptedAt: parsed.policyAcceptedAt ?? new Date(),
      source: parsed.source ?? "customer_site",
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

  const found = await prisma.customerSiteBooking.findFirst({
    where: { id: parsed.bookingId, tenantSiteId: parsedTenant.tenantSiteId },
  });
  if (!found) throw new Error("BOOKING_NOT_FOUND");
  return serializeBooking(found);
}

export async function amendCustomerSiteBooking(
  tenantSiteId: string,
  input: z.infer<typeof amendCustomerSiteBookingSchema>,
): Promise<CustomerSiteBookingRecord> {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsed = parseOrThrow(amendCustomerSiteBookingSchema, input, "amend booking");

  const existing = await prisma.customerSiteBooking.findFirst({
    where: { id: parsed.bookingId, tenantSiteId: parsedTenant.tenantSiteId },
  });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    throw new Error("BOOKING_AMEND_NOT_ALLOWED");
  }

  const serviceId = parsed.serviceId ?? existing.serviceId;
  if (!serviceId) throw new Error("BOOKING_SERVICE_UNAVAILABLE");
  const service = await getTenantService(parsedTenant.tenantSiteId, serviceId);
  const staffMemberId =
    parsed.staffMemberId === undefined ? existing.staffMemberId : parsed.staffMemberId;
  const staffName = await getTenantStaffName(parsedTenant.tenantSiteId, staffMemberId);
  const preferredDate = parsed.preferredDate ?? existing.preferredDate;
  const preferredTime = parsed.preferredTime ?? existing.preferredTime;
  if (!preferredDate || !preferredTime) throw new Error("BOOKING_TIME_REQUIRED");

  const startDateTime = toUtcDateTime(preferredDate, preferredTime);
  const endDateTime = new Date(startDateTime.getTime() + service.durationMinutes * 60 * 1000);

  const row = await prisma.customerSiteBooking.update({
    where: { id: parsed.bookingId },
    data: {
      customerName: parsed.customerName ?? undefined,
      customerEmail: parsed.customerEmail ?? undefined,
      customerPhone: parsed.customerPhone ?? undefined,
      notes: parsed.notes === undefined ? undefined : parsed.notes,
      status: parsed.status ?? undefined,
      serviceId: service.id,
      serviceName: service.name,
      preferredDate,
      preferredTime,
      startDateTime,
      endDateTime,
      staffMemberId,
      staffName,
    },
  });

  return serializeBooking(row);
}
