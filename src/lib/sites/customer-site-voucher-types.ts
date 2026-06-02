import { z } from "zod";

export const voucherDeliveryMethods = ["DIGITAL_EMAIL", "COLLECT_IN_STORE", "POST"] as const;
export type VoucherDeliveryMethod = (typeof voucherDeliveryMethods)[number];

export const voucherStatuses = ["PENDING_PAYMENT", "ACTIVE", "REDEEMED", "CANCELLED", "EXPIRED"] as const;
export type CustomerSiteGiftVoucherStatus = (typeof voucherStatuses)[number];

export const voucherPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"] as const;
export type CustomerSiteGiftVoucherPaymentStatus = (typeof voucherPaymentStatuses)[number];

export type CustomerSiteGiftVoucherSettings = {
  enabled: boolean;
  publicVisible: boolean;
  presetValuesGbp: number[];
  allowCustomAmount: boolean;
  minCustomAmountGbp: number;
  maxCustomAmountGbp: number;
  deliveryMethods: VoucherDeliveryMethod[];
  postageChargeGbp: number;
  validityMonths: number | null;
  termsText: string;
};

export type CustomerSiteGiftVoucherRecord = {
  id: string;
  tenantSiteId: string;
  voucherCode: string;
  amountPence: number;
  remainingAmountPence: number | null;
  postageAmountPence: number;
  currency: string;
  status: CustomerSiteGiftVoucherStatus | string;
  paymentStatus: CustomerSiteGiftVoucherPaymentStatus | string;
  paymentMethod: string | null;
  deliveryMethod: VoucherDeliveryMethod | string;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientAddress: string | null;
  recipientPostcode: string | null;
  message: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  redeemedByStaffId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VoucherEmailDeliveryStatus = {
  businessNotification?: "SENT" | "SKIPPED" | "FAILED";
  purchaserEmail?: "SENT" | "SKIPPED" | "FAILED";
  recipientEmail?: "SENT" | "SKIPPED" | "FAILED";
};

export const DEFAULT_GIFT_VOUCHER_TERMS =
  "Gift vouchers are valid for the stated period after activation. Vouchers are not cash and can only be redeemed directly with this business.";

export const DEFAULT_GIFT_VOUCHER_SETTINGS: CustomerSiteGiftVoucherSettings = {
  enabled: false,
  publicVisible: false,
  presetValuesGbp: [25, 50, 100],
  allowCustomAmount: false,
  minCustomAmountGbp: 10,
  maxCustomAmountGbp: 250,
  deliveryMethods: ["DIGITAL_EMAIL", "COLLECT_IN_STORE"],
  postageChargeGbp: 0,
  validityMonths: 12,
  termsText: DEFAULT_GIFT_VOUCHER_TERMS,
};

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  publicVisible: z.boolean().optional(),
  presetValuesGbp: z.array(z.number().int().min(1).max(5000)).max(12).optional(),
  allowCustomAmount: z.boolean().optional(),
  minCustomAmountGbp: z.number().int().min(1).max(5000).optional(),
  maxCustomAmountGbp: z.number().int().min(1).max(5000).optional(),
  deliveryMethods: z.array(z.enum(voucherDeliveryMethods)).max(3).optional(),
  postageChargeGbp: z.number().int().min(0).max(500).optional(),
  validityMonths: z.number().int().min(1).max(120).nullable().optional(),
  termsText: z.string().trim().max(4000).optional(),
});

export function normalizeGiftVoucherSettings(value: unknown): CustomerSiteGiftVoucherSettings {
  const parsed = settingsSchema.safeParse(value && typeof value === "object" ? value : {});
  const source = parsed.success ? parsed.data : {};
  const presetValues = Array.from(new Set(source.presetValuesGbp ?? DEFAULT_GIFT_VOUCHER_SETTINGS.presetValuesGbp))
    .filter((amount) => Number.isInteger(amount) && amount > 0)
    .sort((a, b) => a - b);
  const deliveryMethods = source.deliveryMethods?.length
    ? source.deliveryMethods
    : DEFAULT_GIFT_VOUCHER_SETTINGS.deliveryMethods;
  const minCustom = source.minCustomAmountGbp ?? DEFAULT_GIFT_VOUCHER_SETTINGS.minCustomAmountGbp;
  const maxCustom = Math.max(source.maxCustomAmountGbp ?? DEFAULT_GIFT_VOUCHER_SETTINGS.maxCustomAmountGbp, minCustom);
  return {
    enabled: source.enabled ?? DEFAULT_GIFT_VOUCHER_SETTINGS.enabled,
    publicVisible: source.publicVisible ?? DEFAULT_GIFT_VOUCHER_SETTINGS.publicVisible,
    presetValuesGbp: presetValues.length ? presetValues : DEFAULT_GIFT_VOUCHER_SETTINGS.presetValuesGbp,
    allowCustomAmount: source.allowCustomAmount ?? DEFAULT_GIFT_VOUCHER_SETTINGS.allowCustomAmount,
    minCustomAmountGbp: minCustom,
    maxCustomAmountGbp: maxCustom,
    deliveryMethods,
    postageChargeGbp: source.postageChargeGbp ?? DEFAULT_GIFT_VOUCHER_SETTINGS.postageChargeGbp,
    validityMonths: source.validityMonths === undefined ? DEFAULT_GIFT_VOUCHER_SETTINGS.validityMonths : source.validityMonths,
    termsText: source.termsText?.trim() || DEFAULT_GIFT_VOUCHER_SETTINGS.termsText,
  };
}

export function vouchersArePublic(settings: unknown): boolean {
  const normalized = normalizeGiftVoucherSettings(settings);
  return normalized.enabled && normalized.publicVisible;
}

export function formatVoucherMoney(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency === "EUR" || currency === "USD" ? currency : "GBP",
  }).format(pence / 100);
}
