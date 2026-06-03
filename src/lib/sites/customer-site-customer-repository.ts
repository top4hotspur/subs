import { z } from "zod";
import { hashAccessCode, verifyAccessCode } from "@/lib/auth/access-code";
import { prisma } from "@/lib/db/prisma";
import {
  customerAccountLoginSchema,
  customerAccountRegisterSchema,
  customerProfileUpdateSchema,
} from "@/lib/sites/customer-site-customer-schema";
import type { CustomerSiteCustomerRecord } from "@/lib/sites/customer-site-customer-types";

function serializeCustomer(record: {
  id: string;
  tenantSiteId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  marketingOptInAt: Date | null;
  crmNotes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteCustomerRecord {
  return {
    ...record,
    marketingOptInAt: record.marketingOptInAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function linkGuestBookingsToCustomerByEmail(
  tenantSiteId: string,
  customerId: string,
  email: string,
): Promise<void> {
  const normalisedEmail = email.trim().toLowerCase();
  const guestBookings = await prisma.customerSiteBooking.findMany({
    where: {
      tenantSiteId,
      customerSiteCustomerId: null,
      customerEmail: { equals: normalisedEmail, mode: "insensitive" },
    },
    select: { id: true, customerEmail: true },
  });
  const matchingIds = guestBookings
    .filter((booking) => booking.customerEmail?.trim().toLowerCase() === normalisedEmail)
    .map((booking) => booking.id);
  if (matchingIds.length === 0) return;
  await prisma.customerSiteBooking.updateMany({
    where: {
      tenantSiteId,
      id: { in: matchingIds },
      customerSiteCustomerId: null,
    },
    data: { customerSiteCustomerId: customerId },
  });
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
    marketingOptIn: parsed.marketingOptIn,
    marketingOptInAt: parsed.marketingOptIn ? new Date() : null,
    active: true,
  };

  const customer = existing
    ? await prisma.customerSiteCustomer.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.customerSiteCustomer.create({ data });
  await linkGuestBookingsToCustomerByEmail(tenantSiteId, customer.id, email);
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
  await linkGuestBookingsToCustomerByEmail(tenantSiteId, customer.id, email);
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

export async function updateCustomerSiteCustomerMarketingPreference(
  tenantSiteId: string,
  customerId: string,
  marketingOptIn: boolean,
): Promise<CustomerSiteCustomerRecord> {
  const customer = await prisma.customerSiteCustomer.updateMany({
    where: { id: customerId, tenantSiteId, active: true },
    data: {
      marketingOptIn,
      marketingOptInAt: marketingOptIn ? new Date() : null,
    },
  });
  if (customer.count === 0) throw new Error("CUSTOMER_ACCOUNT_NOT_FOUND");
  const updated = await prisma.customerSiteCustomer.findFirst({
    where: { id: customerId, tenantSiteId, active: true },
  });
  if (!updated) throw new Error("CUSTOMER_ACCOUNT_NOT_FOUND");
  return serializeCustomer(updated);
}

export async function updateCustomerSiteCustomerProfile(
  tenantSiteId: string,
  customerId: string,
  input: z.infer<typeof customerProfileUpdateSchema>,
): Promise<CustomerSiteCustomerRecord> {
  const parsed = customerProfileUpdateSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const existingWithEmail = await prisma.customerSiteCustomer.findUnique({
    where: { tenantSiteId_email: { tenantSiteId, email } },
    select: { id: true },
  });
  if (existingWithEmail && existingWithEmail.id !== customerId) {
    throw new Error("CUSTOMER_EMAIL_ALREADY_IN_USE");
  }
  const customer = await prisma.customerSiteCustomer.updateMany({
    where: { id: customerId, tenantSiteId, active: true },
    data: {
      firstName: parsed.firstName.trim(),
      lastName: parsed.lastName?.trim() || null,
      email,
      phone: parsed.phone.trim(),
    },
  });
  if (customer.count === 0) throw new Error("CUSTOMER_ACCOUNT_NOT_FOUND");
  const updated = await prisma.customerSiteCustomer.findFirst({
    where: { id: customerId, tenantSiteId, active: true },
  });
  if (!updated) throw new Error("CUSTOMER_ACCOUNT_NOT_FOUND");
  await linkGuestBookingsToCustomerByEmail(tenantSiteId, customerId, email);
  return serializeCustomer(updated);
}
