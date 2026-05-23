export const VoucherDeliveryMethod = {
  DIGITAL_EMAIL: "DIGITAL_EMAIL",
  COLLECT_IN_STORE: "COLLECT_IN_STORE",
  POST: "POST",
} as const;

export type VoucherDeliveryMethod =
  (typeof VoucherDeliveryMethod)[keyof typeof VoucherDeliveryMethod];

export const GiftVoucherStatus = {
  ISSUED: "ISSUED",
  REDEEMED: "REDEEMED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type GiftVoucherStatus =
  (typeof GiftVoucherStatus)[keyof typeof GiftVoucherStatus];

export type GiftVoucherSettings = {
  enabled: boolean;
  allowCustomValue: boolean;
  minValueGbp: number;
  maxValueGbp: number;
  deliveryMethods: VoucherDeliveryMethod[];
  postageChargeGbp: number;
};

export type GiftVoucherRecord = {
  id: string;
  voucherCode: string;
  valueGbp: number;
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail?: string;
  deliveryAddress?: string;
  deliveryMethod: VoucherDeliveryMethod;
  status: GiftVoucherStatus;
  redeemedAtIso?: string;
  redeemedByStaffId?: string;
  redeemedAgainstRequestId?: string;
  createdAtIso: string;
  updatedAtIso: string;
};


