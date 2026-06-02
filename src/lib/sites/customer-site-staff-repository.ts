import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  deleteStaffMemberSchema,
  deleteStaffRoleSchema,
  replaceStaffMembersSchema,
  replaceStaffRolesSchema,
  staffMemberInputSchema,
  staffRoleInputSchema,
  tenantSiteIdSchema,
} from "@/lib/sites/customer-site-staff-schema";
import {
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleRecord,
  WeekdayValue,
} from "@/lib/sites/customer-site-staff-types";

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

function parseWeekdays(value: unknown): WeekdayValue[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<WeekdayValue>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]);
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.toLowerCase())
    .filter((item): item is WeekdayValue => allowed.has(item as WeekdayValue));
}

function parseServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function serializeRole(record: {
  id: string;
  tenantSiteId: string;
  label: string;
  platformRole: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteStaffRoleRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeStaff(record: {
  id: string;
  tenantSiteId: string;
  roleId: string | null;
  displayName: string;
  roleLabel: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  active: boolean;
  customerSelectable: boolean;
  isSuperUser: boolean;
  availableWeekdays: unknown;
  serviceIds: unknown;
  notes: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteStaffMemberRecord {
  return {
    ...record,
    availableWeekdays: parseWeekdays(record.availableWeekdays),
    serviceIds: parseServiceIds(record.serviceIds),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listCustomerSiteStaffRoles(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const roles = await prisma.customerSiteStaffRole.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return roles.map(serializeRole);
}

export async function replaceCustomerSiteStaffRoles(
  tenantSiteId: string,
  roles: Array<z.infer<typeof staffRoleInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceStaffRolesSchema,
    { tenantSiteId, roles },
    "replace customer site staff roles",
  );

  await prisma.$transaction(async (tx) => {
    const existingRoles = await tx.customerSiteStaffRole.findMany({
      where: { tenantSiteId: parsed.tenantSiteId },
      select: { id: true, label: true },
    });
    const existingMap = new Map(existingRoles.map((role) => [role.id, role.label]));

    const keepIds = parsed.roles
      .map((role) => role.id)
      .filter((id): id is string => typeof id === "string");

    const removedRoles = existingRoles.filter((role) => !keepIds.includes(role.id));

    if (removedRoles.length > 0) {
      for (const role of removedRoles) {
        await tx.customerSiteStaffMember.updateMany({
          where: { tenantSiteId: parsed.tenantSiteId, roleId: role.id },
          data: { roleId: null, roleLabel: role.label },
        });
      }

      await tx.customerSiteStaffRole.deleteMany({
        where: {
          tenantSiteId: parsed.tenantSiteId,
          id: { in: removedRoles.map((role) => role.id) },
        },
      });
    }

    for (let index = 0; index < parsed.roles.length; index += 1) {
      const role = parsed.roles[index];
      if (role.id) {
        await tx.customerSiteStaffRole.updateMany({
          where: { id: role.id, tenantSiteId: parsed.tenantSiteId },
          data: {
            label: role.label,
            platformRole: role.platformRole ?? null,
            active: role.active ?? true,
            sortOrder: role.sortOrder ?? index,
          },
        });

        const previousLabel = existingMap.get(role.id);
        if (previousLabel && previousLabel !== role.label) {
          await tx.customerSiteStaffMember.updateMany({
            where: {
              tenantSiteId: parsed.tenantSiteId,
              roleId: role.id,
              roleLabel: previousLabel,
            },
            data: { roleLabel: role.label },
          });
        }
      } else {
        await tx.customerSiteStaffRole.create({
          data: {
            tenantSiteId: parsed.tenantSiteId,
            label: role.label,
            platformRole: role.platformRole ?? null,
            active: role.active ?? true,
            sortOrder: role.sortOrder ?? index,
          },
        });
      }
    }
  });

  return listCustomerSiteStaffRoles(parsed.tenantSiteId);
}

export async function upsertCustomerSiteStaffRole(
  tenantSiteId: string,
  role: z.infer<typeof staffRoleInputSchema>,
) {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsedRole = parseOrThrow(staffRoleInputSchema, role, "customer site staff role");

  const record = parsedRole.id
    ? await prisma.customerSiteStaffRole.updateMany({
        where: { id: parsedRole.id, tenantSiteId: parsedTenant.tenantSiteId },
        data: {
          label: parsedRole.label,
          platformRole: parsedRole.platformRole ?? null,
          active: parsedRole.active ?? true,
          sortOrder: parsedRole.sortOrder ?? 0,
        },
      }).then(async (result) => {
        if (result.count === 0) throw new Error("Customer site staff role not found");
        const found = await prisma.customerSiteStaffRole.findUnique({ where: { id: parsedRole.id! } });
        if (!found) throw new Error("Customer site staff role not found");
        return found;
      })
    : await prisma.customerSiteStaffRole.create({
        data: {
          tenantSiteId: parsedTenant.tenantSiteId,
          label: parsedRole.label,
          platformRole: parsedRole.platformRole ?? null,
          active: parsedRole.active ?? true,
          sortOrder: parsedRole.sortOrder ?? 0,
        },
      });

  return serializeRole(record);
}

export async function deleteCustomerSiteStaffRole(tenantSiteId: string, roleId: string) {
  const parsed = parseOrThrow(
    deleteStaffRoleSchema,
    { tenantSiteId, roleId },
    "delete customer site staff role",
  );

  return prisma.$transaction(async (tx) => {
    const role = await tx.customerSiteStaffRole.findFirst({
      where: { id: parsed.roleId, tenantSiteId: parsed.tenantSiteId },
      select: { id: true, label: true },
    });

    if (!role) return false;

    await tx.customerSiteStaffMember.updateMany({
      where: { tenantSiteId: parsed.tenantSiteId, roleId: parsed.roleId },
      data: { roleId: null, roleLabel: role.label },
    });

    await tx.customerSiteStaffRole.delete({ where: { id: parsed.roleId } });
    return true;
  });
}

export async function listCustomerSiteStaffMembers(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const staff = await prisma.customerSiteStaffMember.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return staff.map(serializeStaff);
}

export async function replaceCustomerSiteStaffMembers(
  tenantSiteId: string,
  staff: Array<z.infer<typeof staffMemberInputSchema>>,
) {
  const parsed = parseOrThrow(
    replaceStaffMembersSchema,
    { tenantSiteId, staff },
    "replace customer site staff members",
  );

  const roleIds = parsed.staff
    .map((member) => member.roleId)
    .filter((roleId): roleId is string => typeof roleId === "string");

  if (roleIds.length > 0) {
    const roles = await prisma.customerSiteStaffRole.findMany({
      where: { tenantSiteId: parsed.tenantSiteId, id: { in: roleIds } },
      select: { id: true },
    });
    const allowed = new Set(roles.map((role) => role.id));
    const invalidRole = roleIds.find((id) => !allowed.has(id));
    if (invalidRole) {
      throw new Error("Invalid staff role for tenant site");
    }
  }

  await prisma.$transaction(async (tx) => {
    const incomingIds = parsed.staff
      .map((member) => member.id)
      .filter((id): id is string => Boolean(id));

    await tx.customerSiteStaffMember.updateMany({
      where: {
        tenantSiteId: parsed.tenantSiteId,
        ...(incomingIds.length > 0 ? { id: { notIn: incomingIds } } : {}),
      },
      data: { active: false },
    });

    for (const [index, member] of parsed.staff.entries()) {
      const data = {
        roleId: member.roleId ?? null,
        displayName: member.displayName,
        roleLabel: member.roleLabel ?? null,
        email: member.email ?? null,
        phone: member.phone ?? null,
        bio: member.bio ?? null,
        active: member.active ?? true,
        customerSelectable: member.customerSelectable ?? false,
        isSuperUser: member.isSuperUser ?? false,
        availableWeekdays:
          member.availableWeekdays === undefined
            ? undefined
            : member.availableWeekdays === null
              ? Prisma.DbNull
              : toJson(member.availableWeekdays),
        serviceIds:
          member.serviceIds === undefined
            ? undefined
            : member.serviceIds === null
              ? Prisma.DbNull
              : toJson(member.serviceIds),
        notes: member.notes ?? null,
        sortOrder: member.sortOrder ?? index,
      };

      if (member.id) {
        const updated = await tx.customerSiteStaffMember.updateMany({
          where: { id: member.id, tenantSiteId: parsed.tenantSiteId },
          data,
        });
        if (updated.count > 0) continue;
      }

      await tx.customerSiteStaffMember.create({
        data: {
          tenantSiteId: parsed.tenantSiteId,
          ...data,
        },
      });
    }
  });

  return listCustomerSiteStaffMembers(parsed.tenantSiteId);
}

export async function upsertCustomerSiteStaffMember(
  tenantSiteId: string,
  staffMember: z.infer<typeof staffMemberInputSchema>,
) {
  const parsedTenant = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const parsedStaff = parseOrThrow(staffMemberInputSchema, staffMember, "customer site staff member");

  if (parsedStaff.roleId) {
    const role = await prisma.customerSiteStaffRole.findFirst({
      where: { id: parsedStaff.roleId, tenantSiteId: parsedTenant.tenantSiteId },
      select: { id: true },
    });
    if (!role) {
      throw new Error("Invalid staff role for tenant site");
    }
  }

  const record = parsedStaff.id
    ? await prisma.customerSiteStaffMember.updateMany({
        where: { id: parsedStaff.id, tenantSiteId: parsedTenant.tenantSiteId },
        data: {
          roleId: parsedStaff.roleId ?? null,
          displayName: parsedStaff.displayName,
          roleLabel: parsedStaff.roleLabel ?? null,
          email: parsedStaff.email ?? null,
          phone: parsedStaff.phone ?? null,
          bio: parsedStaff.bio ?? null,
          active: parsedStaff.active ?? true,
          customerSelectable: parsedStaff.customerSelectable ?? false,
          isSuperUser: parsedStaff.isSuperUser ?? false,
          availableWeekdays:
            parsedStaff.availableWeekdays === undefined
              ? undefined
              : parsedStaff.availableWeekdays === null
                ? Prisma.DbNull
                : toJson(parsedStaff.availableWeekdays),
          serviceIds:
            parsedStaff.serviceIds === undefined
              ? undefined
              : parsedStaff.serviceIds === null
                ? Prisma.DbNull
                : toJson(parsedStaff.serviceIds),
          notes: parsedStaff.notes ?? null,
          sortOrder: parsedStaff.sortOrder ?? 0,
        },
      }).then(async (result) => {
        if (result.count === 0) throw new Error("Customer site staff member not found");
        const found = await prisma.customerSiteStaffMember.findUnique({ where: { id: parsedStaff.id! } });
        if (!found) throw new Error("Customer site staff member not found");
        return found;
      })
    : await prisma.customerSiteStaffMember.create({
        data: {
          tenantSiteId: parsedTenant.tenantSiteId,
          roleId: parsedStaff.roleId ?? null,
          displayName: parsedStaff.displayName,
          roleLabel: parsedStaff.roleLabel ?? null,
          email: parsedStaff.email ?? null,
          phone: parsedStaff.phone ?? null,
          bio: parsedStaff.bio ?? null,
          active: parsedStaff.active ?? true,
          customerSelectable: parsedStaff.customerSelectable ?? false,
          isSuperUser: parsedStaff.isSuperUser ?? false,
          availableWeekdays:
            parsedStaff.availableWeekdays === undefined
              ? undefined
              : parsedStaff.availableWeekdays === null
                ? Prisma.DbNull
                : toJson(parsedStaff.availableWeekdays),
          serviceIds:
            parsedStaff.serviceIds === undefined
              ? undefined
              : parsedStaff.serviceIds === null
                ? Prisma.DbNull
                : toJson(parsedStaff.serviceIds),
          notes: parsedStaff.notes ?? null,
          sortOrder: parsedStaff.sortOrder ?? 0,
        },
      });

  return serializeStaff(record);
}

export async function deleteCustomerSiteStaffMember(tenantSiteId: string, staffMemberId: string) {
  const parsed = parseOrThrow(
    deleteStaffMemberSchema,
    { tenantSiteId, staffMemberId },
    "delete customer site staff member",
  );

  const deleted = await prisma.customerSiteStaffMember.deleteMany({
    where: {
      id: parsed.staffMemberId,
      tenantSiteId: parsed.tenantSiteId,
    },
  });

  return deleted.count > 0;
}
