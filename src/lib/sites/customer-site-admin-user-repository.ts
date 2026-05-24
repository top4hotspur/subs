import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateTemporaryAccessCode, hashAccessCode, verifyAccessCode } from "@/lib/auth/access-code";
import {
  createCustomerSiteAdminUserSchema,
  siteAdminLoginSchema,
  tenantSiteIdSchema,
  updateCustomerSiteAdminUserSchema,
} from "@/lib/sites/customer-site-admin-user-schema";

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`${label} validation failed: ${result.error.message}`);
  }
  return result.data;
}

function toRecord(row: {
  id: string;
  tenantSiteId: string;
  email: string;
  displayName: string | null;
  role: string;
  active: boolean;
  invitationStatus: string;
  accessCodeHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    role: row.role as "OWNER" | "ADMIN",
    invitationStatus: row.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCustomerSiteAdminUsers(tenantSiteId: string) {
  const parsed = parseOrThrow(tenantSiteIdSchema, { tenantSiteId }, "tenant site id");
  const rows = await prisma.customerSiteAdminUser.findMany({
    where: { tenantSiteId: parsed.tenantSiteId },
    orderBy: [{ createdAt: "asc" }],
  });
  return rows.map(toRecord);
}

export async function createCustomerSiteAdminUser(
  input: z.infer<typeof createCustomerSiteAdminUserSchema>,
) {
  const parsed = parseOrThrow(
    createCustomerSiteAdminUserSchema,
    input,
    "create customer site admin user input",
  );

  const accessCode = parsed.accessCode ?? generateTemporaryAccessCode(10);
  const accessCodeHash = hashAccessCode(accessCode);

  const row = await prisma.customerSiteAdminUser.upsert({
    where: {
      tenantSiteId_email: {
        tenantSiteId: parsed.tenantSiteId,
        email: parsed.email,
      },
    },
    update: {
      displayName: parsed.displayName ?? null,
      role: parsed.role,
      active: parsed.active,
      invitationStatus: parsed.invitationStatus,
      accessCodeHash,
    },
    create: {
      tenantSiteId: parsed.tenantSiteId,
      email: parsed.email,
      displayName: parsed.displayName ?? null,
      role: parsed.role,
      active: parsed.active,
      invitationStatus: parsed.invitationStatus,
      accessCodeHash,
    },
  });

  return {
    user: toRecord(row),
    generatedAccessCode: accessCode,
  };
}

export async function updateCustomerSiteAdminUser(
  input: z.infer<typeof updateCustomerSiteAdminUserSchema>,
) {
  const parsed = parseOrThrow(
    updateCustomerSiteAdminUserSchema,
    input,
    "update customer site admin user input",
  );

  const updated = await prisma.customerSiteAdminUser.updateMany({
    where: {
      id: parsed.id,
      tenantSiteId: parsed.tenantSiteId,
    },
    data: {
      ...(parsed.displayName !== undefined ? { displayName: parsed.displayName } : {}),
      ...(parsed.role !== undefined ? { role: parsed.role } : {}),
      ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      ...(parsed.invitationStatus !== undefined
        ? { invitationStatus: parsed.invitationStatus }
        : {}),
      ...(parsed.accessCode ? { accessCodeHash: hashAccessCode(parsed.accessCode) } : {}),
    },
  });

  if (updated.count === 0) {
    return null;
  }

  const row = await prisma.customerSiteAdminUser.findUnique({ where: { id: parsed.id } });
  return row ? toRecord(row) : null;
}

export async function authenticateCustomerSiteAdminUser(input: z.infer<typeof siteAdminLoginSchema>) {
  const parsed = parseOrThrow(siteAdminLoginSchema, input, "site admin login input");

  const tenantSite = await prisma.tenantSite.findUnique({
    where: { slug: parsed.siteSlug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      status: true,
    },
  });
  if (!tenantSite) return null;

  const user = await prisma.customerSiteAdminUser.findFirst({
    where: {
      tenantSiteId: tenantSite.id,
      email: parsed.email,
      active: true,
      invitationStatus: { in: ["INVITED", "ACTIVE"] },
    },
  });
  if (!user) return null;

  if (!verifyAccessCode(parsed.accessCode, user.accessCodeHash)) {
    return null;
  }

  if (user.invitationStatus === "INVITED") {
    await prisma.customerSiteAdminUser.update({
      where: { id: user.id },
      data: { invitationStatus: "ACTIVE" },
    });
  }

  return {
    siteAdminUserId: user.id,
    tenantSiteId: tenantSite.id,
    tenantSlug: tenantSite.slug,
    tenantDisplayName: tenantSite.displayName,
    siteAdminRole: user.role as "OWNER" | "ADMIN",
    email: user.email,
    displayName: user.displayName,
  };
}

