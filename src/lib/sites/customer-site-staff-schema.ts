import { z } from "zod";
import { WEEKDAY_VALUES } from "@/lib/sites/customer-site-staff-types";

const cuid = z.string().cuid();
const weekdaySchema = z.enum(WEEKDAY_VALUES);

const staffPermissionsSchema = z.object({
  viewAppointments: z.boolean().optional().default(true),
  markCompleted: z.boolean().optional().default(false),
  addManualBooking: z.boolean().optional().default(false),
  amendBooking: z.boolean().optional().default(false),
  cancelBooking: z.boolean().optional().default(false),
  viewCustomerContactDetails: z.boolean().optional().default(false),
  viewPaymentStatus: z.boolean().optional().default(false),
  redeemVouchers: z.boolean().optional().default(false),
});

export const staffRoleInputSchema = z.object({
  id: cuid.optional(),
  label: z.string().trim().min(1).max(120),
  platformRole: z.string().trim().max(120).nullable().optional(),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
});

export const replaceStaffRolesSchema = z.object({
  tenantSiteId: cuid,
  roles: z.array(staffRoleInputSchema).max(500),
});

export const staffMemberInputSchema = z.object({
  id: cuid.optional(),
  roleId: cuid.nullable().optional(),
  displayName: z.string().trim().min(1).max(140),
  roleLabel: z.string().trim().max(140).nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional(),
  phone: z.string().trim().max(60).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  active: z.boolean().optional().default(true),
  customerSelectable: z.boolean().optional().default(false),
  isSuperUser: z.boolean().optional().default(false),
  staffPermissions: staffPermissionsSchema.nullable().optional(),
  availableWeekdays: z.array(weekdaySchema).max(7).nullable().optional(),
  serviceIds: z.array(z.string().trim().min(1).max(120)).max(500).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
});

export const replaceStaffMembersSchema = z.object({
  tenantSiteId: cuid,
  staff: z.array(staffMemberInputSchema).max(1000),
});

export const updateStaffMemberSchema = z.object({
  tenantSiteId: cuid,
  staffMemberId: cuid,
  staffMember: staffMemberInputSchema,
});

export const tenantSiteIdSchema = z.object({
  tenantSiteId: cuid,
});

export const deleteStaffRoleSchema = z.object({
  tenantSiteId: cuid,
  roleId: cuid,
});

export const deleteStaffMemberSchema = z.object({
  tenantSiteId: cuid,
  staffMemberId: cuid,
});
