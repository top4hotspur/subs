import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  breakWindowInputSchema,
  businessClosureInputSchema,
  replaceBusinessClosuresSchema,
  replaceStaffBreaksSchema,
  replaceStaffHolidaysSchema,
  replaceStaffRotaSchema,
  schedulingSnapshotInputSchema,
  staffHolidayInputSchema,
  tenantSiteIdSchema,
} from "@/lib/sites/customer-site-scheduling-schema";
import type {
  CustomerSiteBusinessClosureRecord,
  CustomerSiteSchedulingSnapshot,
  CustomerSiteStaffBreakWindowRecord,
  CustomerSiteStaffHolidayRecord,
  CustomerSiteStaffRotaDayRecord,
  WeekdayValue,
} from "@/lib/sites/customer-site-scheduling-types";

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

function toMinutes(value: string | null | undefined): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateBreaksInsideRota(
  rotaDays: Array<{ staffMemberId: string; weekday: string; working?: boolean; startTime?: string | null; endTime?: string | null }>,
  breakWindows: Array<{ staffMemberId: string; weekday: string; active?: boolean; startTime: string; endTime: string }>,
): void {
  for (const window of breakWindows) {
    if (window.active === false) continue;
    const rotaDay = rotaDays.find((day) => day.staffMemberId === window.staffMemberId && day.weekday === window.weekday);
    if (!rotaDay?.working || !rotaDay.startTime || !rotaDay.endTime) {
      throw new Error("Break windows must sit inside a working rota day for the same staff member.");
    }
    const breakStart = toMinutes(window.startTime);
    const breakEnd = toMinutes(window.endTime);
    const rotaStart = toMinutes(rotaDay.startTime);
    const rotaEnd = toMinutes(rotaDay.endTime);
    if (
      breakStart === null ||
      breakEnd === null ||
      rotaStart === null ||
      rotaEnd === null ||
      breakStart < rotaStart ||
      breakEnd > rotaEnd
    ) {
      throw new Error("Break windows must be inside staff rota hours.");
    }
  }
}

async function assertStaffBelongsToTenant(
  tenantSiteId: string,
  staffMemberIds: string[],
): Promise<void> {
  if (staffMemberIds.length === 0) return;
  const uniq = [...new Set(staffMemberIds)];
  const rows = await prisma.customerSiteStaffMember.findMany({
    where: { tenantSiteId, id: { in: uniq } },
    select: { id: true },
  });
  const allowed = new Set(rows.map((row) => row.id));
  const invalid = uniq.find((id) => !allowed.has(id));
  if (invalid) {
    throw new Error("Invalid staff member for tenant site");
  }
}

function serializeRotaDay(record: {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  weekday: string;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteStaffRotaDayRecord {
  return {
    ...record,
    weekday: record.weekday as WeekdayValue,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeBreakWindow(record: {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  rotaDayId: string | null;
  weekday: string;
  label: string | null;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteStaffBreakWindowRecord {
  return {
    ...record,
    weekday: record.weekday as WeekdayValue,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeBusinessClosure(record: {
  id: string;
  tenantSiteId: string;
  date: string;
  endDate: string | null;
  label: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
  customerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteBusinessClosureRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeStaffHoliday(record: {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  date: string;
  endDate: string | null;
  label: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteStaffHolidayRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listCustomerSiteRotaDays(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const rows = await prisma.customerSiteStaffRotaDay.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ staffMemberId: "asc" }, { weekday: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializeRotaDay);
}

export async function replaceCustomerSiteRotaDays(
  tenantSiteId: string,
  rotaDays: Array<z.infer<typeof import("@/lib/sites/customer-site-scheduling-schema").rotaDayInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceStaffRotaSchema,
    { tenantSiteId, rotaDays },
    "replace customer site rota days",
  );

  await assertStaffBelongsToTenant(
    parsed.tenantSiteId,
    parsed.rotaDays.map((item) => item.staffMemberId),
  );

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteStaffRotaDay.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    if (parsed.rotaDays.length > 0) {
      await tx.customerSiteStaffRotaDay.createMany({
        data: parsed.rotaDays.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          weekday: item.weekday,
          working: item.working ?? false,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
        })),
      });
    }
  });

  return listCustomerSiteRotaDays(parsed.tenantSiteId);
}

export async function listCustomerSiteBreakWindows(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const rows = await prisma.customerSiteStaffBreakWindow.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ staffMemberId: "asc" }, { weekday: "asc" }, { startTime: "asc" }],
  });
  return rows.map(serializeBreakWindow);
}

export async function replaceCustomerSiteBreakWindows(
  tenantSiteId: string,
  breakWindows: Array<z.infer<typeof breakWindowInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceStaffBreaksSchema,
    { tenantSiteId, breakWindows },
    "replace customer site break windows",
  );

  await assertStaffBelongsToTenant(
    parsed.tenantSiteId,
    parsed.breakWindows.map((item) => item.staffMemberId),
  );
  const rotaDays = await listCustomerSiteRotaDays(parsed.tenantSiteId);
  validateBreaksInsideRota(rotaDays, parsed.breakWindows);

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteStaffBreakWindow.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    if (parsed.breakWindows.length > 0) {
      await tx.customerSiteStaffBreakWindow.createMany({
        data: parsed.breakWindows.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          rotaDayId: item.rotaDayId ?? null,
          weekday: item.weekday,
          label: item.label ?? null,
          startTime: item.startTime,
          endTime: item.endTime,
          active: item.active ?? true,
        })),
      });
    }
  });

  return listCustomerSiteBreakWindows(parsed.tenantSiteId);
}

export async function listCustomerSiteBusinessClosures(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const rows = await prisma.customerSiteBusinessClosure.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializeBusinessClosure);
}

export async function replaceCustomerSiteBusinessClosures(
  tenantSiteId: string,
  businessClosures: Array<z.infer<typeof businessClosureInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceBusinessClosuresSchema,
    { tenantSiteId, businessClosures },
    "replace customer site business closures",
  );

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteBusinessClosure.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    if (parsed.businessClosures.length > 0) {
      await tx.customerSiteBusinessClosure.createMany({
        data: parsed.businessClosures.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          date: item.date,
          endDate: item.endDate || item.date,
          label: item.label,
          allDay: item.allDay ?? true,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          active: item.active ?? true,
          customerNote: item.customerNote ?? null,
        })),
      });
    }
  });

  return listCustomerSiteBusinessClosures(parsed.tenantSiteId);
}

export async function listCustomerSiteStaffHolidays(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const rows = await prisma.customerSiteStaffHoliday.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializeStaffHoliday);
}

export async function replaceCustomerSiteStaffHolidays(
  tenantSiteId: string,
  staffHolidays: Array<z.infer<typeof staffHolidayInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceStaffHolidaysSchema,
    { tenantSiteId, staffHolidays },
    "replace customer site staff holidays",
  );

  await assertStaffBelongsToTenant(
    parsed.tenantSiteId,
    parsed.staffHolidays.map((item) => item.staffMemberId),
  );

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteStaffHoliday.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    if (parsed.staffHolidays.length > 0) {
      await tx.customerSiteStaffHoliday.createMany({
        data: parsed.staffHolidays.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          date: item.date,
          endDate: item.endDate || item.date,
          label: item.label,
          allDay: item.allDay ?? true,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          active: item.active ?? true,
          notes: item.notes ?? null,
        })),
      });
    }
  });

  return listCustomerSiteStaffHolidays(parsed.tenantSiteId);
}

export async function getCustomerSiteSchedulingSnapshot(
  tenantSiteId: string,
): Promise<CustomerSiteSchedulingSnapshot> {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const [rotaDays, breakWindows, businessClosures, staffHolidays] = await Promise.all([
    listCustomerSiteRotaDays(parsed.tenantSiteId),
    listCustomerSiteBreakWindows(parsed.tenantSiteId),
    listCustomerSiteBusinessClosures(parsed.tenantSiteId),
    listCustomerSiteStaffHolidays(parsed.tenantSiteId),
  ]);

  return { rotaDays, breakWindows, businessClosures, staffHolidays };
}

export async function replaceCustomerSiteSchedulingSnapshot(
  tenantSiteId: string,
  snapshot: {
    rotaDays: Array<z.infer<typeof import("@/lib/sites/customer-site-scheduling-schema").rotaDayInputSchema>>;
    breakWindows: Array<z.infer<typeof breakWindowInputSchema>>;
    businessClosures: Array<z.infer<typeof businessClosureInputSchema>>;
    staffHolidays: Array<z.infer<typeof staffHolidayInputSchema>>;
  },
): Promise<CustomerSiteSchedulingSnapshot> {
  const parsed = parseOrThrow(
    schedulingSnapshotInputSchema,
    { tenantSiteId, ...snapshot },
    "replace customer site scheduling snapshot",
  );

  const staffIds = [
    ...parsed.rotaDays.map((item) => item.staffMemberId),
    ...parsed.breakWindows.map((item) => item.staffMemberId),
    ...parsed.staffHolidays.map((item) => item.staffMemberId),
  ];
  await assertStaffBelongsToTenant(parsed.tenantSiteId, staffIds);
  validateBreaksInsideRota(parsed.rotaDays, parsed.breakWindows);

  await prisma.$transaction(async (tx) => {
    await tx.customerSiteStaffBreakWindow.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    await tx.customerSiteStaffRotaDay.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    await tx.customerSiteStaffHoliday.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });
    await tx.customerSiteBusinessClosure.deleteMany({ where: { tenantSiteId: parsed.tenantSiteId } });

    if (parsed.rotaDays.length > 0) {
      await tx.customerSiteStaffRotaDay.createMany({
        data: parsed.rotaDays.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          weekday: item.weekday,
          working: item.working ?? false,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
        })),
      });
    }

    if (parsed.breakWindows.length > 0) {
      await tx.customerSiteStaffBreakWindow.createMany({
        data: parsed.breakWindows.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          rotaDayId: null,
          weekday: item.weekday,
          label: item.label ?? null,
          startTime: item.startTime,
          endTime: item.endTime,
          active: item.active ?? true,
        })),
      });
    }

    if (parsed.businessClosures.length > 0) {
      await tx.customerSiteBusinessClosure.createMany({
        data: parsed.businessClosures.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          date: item.date,
          endDate: item.endDate || item.date,
          label: item.label,
          allDay: item.allDay ?? true,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          active: item.active ?? true,
          customerNote: item.customerNote ?? null,
        })),
      });
    }

    if (parsed.staffHolidays.length > 0) {
      await tx.customerSiteStaffHoliday.createMany({
        data: parsed.staffHolidays.map((item) => ({
          tenantSiteId: parsed.tenantSiteId,
          staffMemberId: item.staffMemberId,
          date: item.date,
          endDate: item.endDate || item.date,
          label: item.label,
          allDay: item.allDay ?? true,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          active: item.active ?? true,
          notes: item.notes ?? null,
        })),
      });
    }
  });

  return getCustomerSiteSchedulingSnapshot(parsed.tenantSiteId);
}
