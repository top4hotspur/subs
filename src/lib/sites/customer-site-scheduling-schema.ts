import { z } from "zod";
import { WEEKDAY_VALUES } from "@/lib/sites/customer-site-scheduling-types";

const cuid = z.string().cuid();
const weekdaySchema = z.enum(WEEKDAY_VALUES);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

function toMinutes(value: string | null | undefined): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const rotaDayInputSchema = z.object({
  id: cuid.optional(),
  staffMemberId: cuid,
  weekday: weekdaySchema,
  working: z.boolean().optional().default(false),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
}).superRefine((value, ctx) => {
  if (!value.working) return;
  if (!value.startTime) {
    ctx.addIssue({ code: "custom", path: ["startTime"], message: "Working days need a start time." });
  }
  if (!value.endTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "Working days need an end time." });
  }
  const start = toMinutes(value.startTime);
  const end = toMinutes(value.endTime);
  if (start !== null && end !== null && end <= start) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
  }
});

export const replaceStaffRotaSchema = z.object({
  tenantSiteId: cuid,
  rotaDays: z.array(rotaDayInputSchema).max(5000),
});

export const breakWindowInputSchema = z.object({
  id: cuid.optional(),
  staffMemberId: cuid,
  rotaDayId: cuid.nullable().optional(),
  weekday: weekdaySchema,
  label: z.string().trim().max(140).nullable().optional(),
  startTime: timeSchema,
  endTime: timeSchema,
  active: z.boolean().optional().default(true),
}).superRefine((value, ctx) => {
  const start = toMinutes(value.startTime);
  const end = toMinutes(value.endTime);
  if (start !== null && end !== null && end <= start) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "Break end time must be after break start time." });
  }
});

export const replaceStaffBreaksSchema = z.object({
  tenantSiteId: cuid,
  breakWindows: z.array(breakWindowInputSchema).max(5000),
});

export const businessClosureInputSchema = z.object({
  id: cuid.optional(),
  date: dateSchema,
  endDate: dateSchema.nullable().optional(),
  label: z.string().trim().min(1).max(200),
  allDay: z.boolean().optional().default(true),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  active: z.boolean().optional().default(true),
  customerNote: z.string().trim().max(600).nullable().optional(),
}).superRefine((value, ctx) => {
  const endDate = value.endDate || value.date;
  if (endDate < value.date) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "Closure end date cannot be before start date." });
  }
  if (!value.allDay) {
    if (!value.startTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "Partial-day closures need a start time." });
    }
    if (!value.endTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Partial-day closures need an end time." });
    }
    const start = toMinutes(value.startTime);
    const end = toMinutes(value.endTime);
    if (endDate === value.date && start !== null && end !== null && end <= start) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Closure end time must be after start time." });
    }
  }
});

export const replaceBusinessClosuresSchema = z.object({
  tenantSiteId: cuid,
  businessClosures: z.array(businessClosureInputSchema).max(5000),
});

export const staffHolidayInputSchema = z.object({
  id: cuid.optional(),
  staffMemberId: cuid,
  date: dateSchema,
  endDate: dateSchema.nullable().optional(),
  label: z.string().trim().min(1).max(200),
  allDay: z.boolean().optional().default(true),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  active: z.boolean().optional().default(true),
  notes: z.string().trim().max(800).nullable().optional(),
}).superRefine((value, ctx) => {
  const endDate = value.endDate || value.date;
  if (endDate < value.date) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "Staff leave end date cannot be before start date." });
  }
  if (!value.allDay) {
    if (!value.startTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "Partial-day staff leave needs a start time." });
    }
    if (!value.endTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Partial-day staff leave needs an end time." });
    }
    const start = toMinutes(value.startTime);
    const end = toMinutes(value.endTime);
    if (endDate === value.date && start !== null && end !== null && end <= start) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Staff leave end time must be after start time." });
    }
  }
});

export const replaceStaffHolidaysSchema = z.object({
  tenantSiteId: cuid,
  staffHolidays: z.array(staffHolidayInputSchema).max(5000),
});

export const schedulingSnapshotInputSchema = z.object({
  tenantSiteId: cuid,
  rotaDays: z.array(rotaDayInputSchema).max(5000),
  breakWindows: z.array(breakWindowInputSchema).max(5000),
  businessClosures: z.array(businessClosureInputSchema).max(5000),
  staffHolidays: z.array(staffHolidayInputSchema).max(5000),
});

export const tenantSiteIdSchema = z.object({ tenantSiteId: cuid });
