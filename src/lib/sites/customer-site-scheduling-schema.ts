import { z } from "zod";
import { WEEKDAY_VALUES } from "@/lib/sites/customer-site-scheduling-types";

const cuid = z.string().cuid();
const weekdaySchema = z.enum(WEEKDAY_VALUES);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

export const rotaDayInputSchema = z.object({
  id: cuid.optional(),
  staffMemberId: cuid,
  weekday: weekdaySchema,
  working: z.boolean().optional().default(false),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
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
});

export const replaceStaffBreaksSchema = z.object({
  tenantSiteId: cuid,
  breakWindows: z.array(breakWindowInputSchema).max(5000),
});

export const businessClosureInputSchema = z.object({
  id: cuid.optional(),
  date: dateSchema,
  label: z.string().trim().min(1).max(200),
  allDay: z.boolean().optional().default(true),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  active: z.boolean().optional().default(true),
});

export const replaceBusinessClosuresSchema = z.object({
  tenantSiteId: cuid,
  businessClosures: z.array(businessClosureInputSchema).max(5000),
});

export const staffHolidayInputSchema = z.object({
  id: cuid.optional(),
  staffMemberId: cuid,
  date: dateSchema,
  label: z.string().trim().min(1).max(200),
  allDay: z.boolean().optional().default(true),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  active: z.boolean().optional().default(true),
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
