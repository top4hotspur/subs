import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  createContactEnquirySchema,
  listContactEnquiriesSchema,
  updateContactEnquiryStatusSchema,
} from "@/lib/contact/contact-enquiry-schema";

type CreateContactEnquiryInput = z.infer<typeof createContactEnquirySchema>;
type ListContactEnquiriesInput = Partial<z.infer<typeof listContactEnquiriesSchema>>;
type UpdateContactEnquiryStatusInput = z.infer<typeof updateContactEnquiryStatusSchema>;

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

export async function createContactEnquiry(input: CreateContactEnquiryInput) {
  const parsed = parseOrThrow(createContactEnquirySchema, input, "contact enquiry input");
  return prisma.contactEnquiry.create({
    data: {
      name: parsed.name,
      businessName: parsed.businessName,
      email: parsed.email,
      phone: parsed.phone,
      industrySlug: parsed.industrySlug,
      message: parsed.message,
      source: parsed.source ?? "contact-page",
      status: "NEW",
    },
  });
}

export async function listContactEnquiries(options: ListContactEnquiriesInput = {}) {
  const parsed = parseOrThrow(listContactEnquiriesSchema, options, "list contact enquiries input");
  return prisma.contactEnquiry.findMany({
    where: {
      status: parsed.status,
      email: parsed.email,
      industrySlug: parsed.industrySlug,
    },
    orderBy: { createdAt: "desc" },
    take: parsed.take,
    skip: parsed.skip,
  });
}

export async function updateContactEnquiryStatus(input: UpdateContactEnquiryStatusInput) {
  const parsed = parseOrThrow(
    updateContactEnquiryStatusSchema,
    input,
    "update contact enquiry status input",
  );

  return prisma.contactEnquiry.update({
    where: { id: parsed.id },
    data: { status: parsed.status },
  });
}

