import { z } from "zod";
import { hashAccessCode, verifyAccessCode } from "@/lib/auth/access-code";
import { prisma } from "@/lib/db/prisma";
import {
  customerAccountLoginSchema,
  customerAccountRegisterSchema,
} from "@/lib/sites/customer-site-customer-schema";
import type { CustomerSiteCustomerRecord } from "@/lib/sites/customer-site-customer-types";

function serializeCustomer(record: {
  id: string;
  tenantSiteId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteCustomerRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function registerCustomerSiteCustomer(
  tenantSiteId: string,
  input: z.infer<typeof customerAccountRegisterSchema>,
): Promise<CustomerSiteCustomerRecord> {
  const parsed = customerAccountRegisterSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const existing = await prisma.customerSiteCustomer.findUnique({
    where: { tenantSiteId_email: { tenantSiteId, email } },
  });
  if (existing?.active) throw new Error("CUSTOMER_ACCOUNT_EXISTS");

  const data = {
    tenantSiteId,
    email,
    firstName: parsed.firstName.trim(),
    lastName: parsed.lastName?.trim() || null,
    phone: parsed.phone.trim(),
    accessCodeHash: hashAccessCode(parsed.accessCode),
    active: true,
  };

  const customer = existing
    ? await prisma.customerSiteCustomer.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.customerSiteCustomer.create({ data });
  return serializeCustomer(customer);
}

export async function authenticateCustomerSiteCustomer(
  tenantSiteId: string,
  input: z.infer<typeof customerAccountLoginSchema>,
): Promise<CustomerSiteCustomerRecord | null> {
  const parsed = customerAccountLoginSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const customer = await prisma.customerSiteCustomer.findUnique({
    where: { tenantSiteId_email: { tenantSiteId, email } },
  });
  if (!customer?.active || !verifyAccessCode(parsed.accessCode, customer.accessCodeHash)) return null;
  return serializeCustomer(customer);
}

export async function getCustomerSiteCustomerById(
  tenantSiteId: string,
  customerId: string,
): Promise<CustomerSiteCustomerRecord | null> {
  const customer = await prisma.customerSiteCustomer.findFirst({
    where: { id: customerId, tenantSiteId, active: true },
  });
  return customer ? serializeCustomer(customer) : null;
}
