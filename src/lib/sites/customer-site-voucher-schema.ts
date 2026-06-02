import { z } from "zod";
import { voucherDeliveryMethods } from "@/lib/sites/customer-site-voucher-types";

export const saveGiftVoucherSettingsSchema = z.object({
  enabled: z.boolean(),
  publicVisible: z.boolean(),
  presetValuesGbp: z.array(z.number().int().min(1).max(5000)).max(12),
  allowCustomAmount: z.boolean(),
  minCustomAmountGbp: z.number().int().min(1).max(5000),
  maxCustomAmountGbp: z.number().int().min(1).max(5000),
  deliveryMethods: z.array(z.enum(voucherDeliveryMethods)).min(1).max(3),
  postageChargeGbp: z.number().int().min(0).max(500),
  validityMonths: z.number().int().min(1).max(120).nullable(),
  termsText: z.string().trim().min(1).max(4000),
}).refine((value) => value.maxCustomAmountGbp >= value.minCustomAmountGbp, {
  path: ["maxCustomAmountGbp"],
  message: "Maximum custom amount must be greater than or equal to minimum custom amount.",
});

export const publicGiftVoucherRequestSchema = z.object({
  amountGbp: z.number().int().min(1).max(5000),
  deliveryMethod: z.enum(voucherDeliveryMethods),
  purchaserName: z.string().trim().min(2).max(120),
  purchaserEmail: z.string().trim().email().max(180),
  purchaserPhone: z.string().trim().max(80).optional().nullable(),
  recipientName: z.string().trim().max(120).optional().nullable(),
  recipientEmail: z.string().trim().email().max(180).optional().nullable(),
  recipientAddress: z.string().trim().max(500).optional().nullable(),
  recipientPostcode: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(600).optional().nullable(),
  termsAccepted: z.literal(true),
});

export const voucherActionSchema = z.object({
  action: z.enum(["MARK_PAYMENT_RECEIVED", "MARK_REDEEMED", "CANCEL", "MARK_EXPIRED", "RESEND_EMAIL"]),
});

export const voucherCodeLookupSchema = z.object({
  code: z.string().trim().min(3).max(80),
});
