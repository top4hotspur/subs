import { z } from "zod";

const cuidSchema = z.string().cuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd");
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");

const bookingStatusSchema = z.enum([
  "SUBMITTED",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

const paymentStatusSchema = z.enum([
  "PAYMENT_REQUIRED",
  "PAYMENT_COMPLETED",
  "NOT_REQUIRED",
]);

export const createCustomerSiteBookingSchema = z
  .object({
    serviceId: cuidSchema.optional(),
    serviceName: z.string().trim().min(1).max(120).optional(),
    customerName: z.string().trim().min(1).max(120),
    customerEmail: z.string().trim().email().max(320).optional(),
    customerPhone: z.string().trim().min(5).max(40).optional(),
    preferredDate: dateSchema.optional(),
    preferredTime: timeSchema.optional(),
    staffMemberId: cuidSchema.optional(),
    staffName: z.string().trim().min(1).max(120).optional(),
    status: bookingStatusSchema.default("SUBMITTED"),
    paymentStatus: paymentStatusSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
    source: z.string().trim().min(1).max(60).default("preview"),
    rawPayload: z.unknown().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.customerEmail && !value.customerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerEmail"],
        message: "Provide at least an email or phone number.",
      });
    }
  });

export const updateCustomerSiteBookingStatusSchema = z.object({
  bookingId: cuidSchema,
  status: bookingStatusSchema,
  paymentStatus: paymentStatusSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const listCustomerSiteBookingsSchema = z.object({
  status: bookingStatusSchema.optional(),
  preferredDate: dateSchema.optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

