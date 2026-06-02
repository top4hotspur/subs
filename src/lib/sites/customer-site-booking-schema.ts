import { z } from "zod";

const cuidSchema = z.string().cuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd");
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");

const bookingStatusSchema = z.enum([
  "REQUESTED",
  "SUBMITTED",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

const paymentStatusSchema = z.enum([
  "NOT_REQUIRED",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PAYMENT_REQUIRED",
  "PAYMENT_COMPLETED",
]);

const paymentMethodSchema = z.enum([
  "NONE",
  "CASH",
  "CARD_ONLINE",
  "MANUAL",
]);

const refundStatusSchema = z.enum([
  "NOT_REQUIRED",
  "REVIEW_REQUIRED",
  "FULL_REFUND_ELIGIBLE",
  "NO_REFUND_RECOMMENDED",
  "PENDING",
  "REFUNDED",
  "PARTIAL_REFUND",
  "DECLINED",
  "MANUAL_REQUIRED",
]);

export const createCustomerSiteBookingSchema = z
  .object({
    serviceId: cuidSchema,
    serviceName: z.string().trim().min(1).max(120).optional(),
    customerName: z.string().trim().min(1).max(120),
    customerEmail: z.string().trim().email().max(320),
    customerPhone: z.string().trim().min(5).max(40),
    preferredDate: dateSchema,
    preferredTime: timeSchema,
    staffMemberId: cuidSchema.optional(),
    staffName: z.string().trim().min(1).max(120).optional(),
    status: bookingStatusSchema.default("REQUESTED"),
    paymentStatus: paymentStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    paymentAmountPence: z.number().int().min(0).max(10000000).optional(),
    paymentCurrency: z.string().trim().length(3).optional(),
    paymentProvider: z.string().trim().min(1).max(40).optional(),
    paymentProviderSessionId: z.string().trim().min(1).max(255).optional(),
    paymentProviderPaymentIntentId: z.string().trim().min(1).max(255).optional(),
    refundStatus: refundStatusSchema.optional(),
    refundGuidance: z.string().trim().min(1).max(1200).nullable().optional(),
    cancellationReason: z.string().trim().min(1).max(1200).nullable().optional(),
    cancelledAt: z.coerce.date().optional(),
    notes: z.string().trim().max(2000).optional(),
    policyAccepted: z.boolean().optional().default(false),
    policyAcceptedAt: z.coerce.date().optional(),
    source: z.string().trim().min(1).max(60).default("preview"),
    rawPayload: z.unknown().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.policyAccepted && !value.policyAcceptedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["policyAccepted"],
        message: "Please confirm that you have read and accepted the booking and cancellation policy.",
      });
    }
  });

export const updateCustomerSiteBookingStatusSchema = z.object({
  bookingId: cuidSchema,
  status: bookingStatusSchema,
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  paymentAmountPence: z.number().int().min(0).max(10000000).optional(),
  paymentCurrency: z.string().trim().length(3).optional(),
  paymentProvider: z.string().trim().min(1).max(40).optional(),
  paymentProviderSessionId: z.string().trim().min(1).max(255).optional(),
  paymentProviderPaymentIntentId: z.string().trim().min(1).max(255).optional(),
  refundStatus: refundStatusSchema.optional(),
  refundGuidance: z.string().trim().min(1).max(1200).nullable().optional(),
  cancellationReason: z.string().trim().min(1).max(1200).nullable().optional(),
  cancelledAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const amendCustomerSiteBookingSchema = z.object({
  bookingId: cuidSchema,
  customerName: z.string().trim().min(1).max(120).optional(),
  customerEmail: z.string().trim().email().max(320).optional(),
  customerPhone: z.string().trim().min(5).max(40).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: bookingStatusSchema.optional(),
  serviceId: cuidSchema.optional(),
  preferredDate: dateSchema.optional(),
  preferredTime: timeSchema.optional(),
  staffMemberId: cuidSchema.nullable().optional(),
});

export const listCustomerSiteBookingsSchema = z.object({
  status: bookingStatusSchema.optional(),
  preferredDate: dateSchema.optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
