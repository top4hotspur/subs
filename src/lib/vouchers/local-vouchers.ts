import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  GiftVoucherRecord,
  GiftVoucherSettings,
  GiftVoucherStatus,
  VoucherDeliveryMethod,
} from "@/lib/vouchers/voucher-types";

function voucherSettingsKey(slug: WebsiteTemplateSlug): string {
  return `subs-voucher-settings:${slug}`;
}

function voucherRecordsKey(slug: WebsiteTemplateSlug): string {
  return `subs-vouchers:${slug}`;
}

const defaultVoucherSettings: GiftVoucherSettings = {
  enabled: true,
  allowCustomValue: true,
  minValueGbp: 10,
  maxValueGbp: 250,
  deliveryMethods: [
    VoucherDeliveryMethod.DIGITAL_EMAIL,
    VoucherDeliveryMethod.COLLECT_IN_STORE,
    VoucherDeliveryMethod.POST,
  ],
  postageChargeGbp: 2.5,
};

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function randomCode(): string {
  return `GV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;
}

export function getLocalVoucherSettings(slug: WebsiteTemplateSlug): GiftVoucherSettings {
  if (typeof window === "undefined") return defaultVoucherSettings;
  return parseJson<GiftVoucherSettings>(
    window.localStorage.getItem(voucherSettingsKey(slug)),
    defaultVoucherSettings,
  );
}

export function saveLocalVoucherSettings(
  slug: WebsiteTemplateSlug,
  settings: GiftVoucherSettings,
): GiftVoucherSettings {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(voucherSettingsKey(slug), JSON.stringify(settings));
  }
  return settings;
}

export function listLocalVouchers(slug: WebsiteTemplateSlug): GiftVoucherRecord[] {
  if (typeof window === "undefined") return [];
  const records = parseJson<GiftVoucherRecord[]>(
    window.localStorage.getItem(voucherRecordsKey(slug)),
    [],
  );
  return records.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

function saveLocalVouchers(slug: WebsiteTemplateSlug, records: GiftVoucherRecord[]): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(voucherRecordsKey(slug), JSON.stringify(records));
  }
}

export function createLocalVoucher(
  slug: WebsiteTemplateSlug,
  input: Omit<GiftVoucherRecord, "id" | "voucherCode" | "status" | "createdAtIso" | "updatedAtIso">,
): GiftVoucherRecord {
  const now = new Date().toISOString();
  const record: GiftVoucherRecord = {
    ...input,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : randomCode(),
    voucherCode: randomCode(),
    status: GiftVoucherStatus.ISSUED,
    createdAtIso: now,
    updatedAtIso: now,
  };
  const all = listLocalVouchers(slug);
  all.unshift(record);
  saveLocalVouchers(slug, all);
  return record;
}

export function findLocalVoucherByCode(
  slug: WebsiteTemplateSlug,
  voucherCode: string,
): GiftVoucherRecord | null {
  const code = voucherCode.trim().toUpperCase();
  return listLocalVouchers(slug).find((v) => v.voucherCode.toUpperCase() === code) ?? null;
}

export function redeemLocalVoucher(
  slug: WebsiteTemplateSlug,
  voucherId: string,
  details: { redeemedByStaffId?: string; redeemedAgainstRequestId?: string },
): GiftVoucherRecord | null {
  const now = new Date().toISOString();
  const updated = listLocalVouchers(slug).map((voucher) =>
    voucher.id === voucherId
      ? {
          ...voucher,
          status: GiftVoucherStatus.REDEEMED,
          redeemedAtIso: now,
          redeemedByStaffId: details.redeemedByStaffId,
          redeemedAgainstRequestId: details.redeemedAgainstRequestId,
          updatedAtIso: now,
        }
      : voucher,
  );
  saveLocalVouchers(slug, updated);
  return updated.find((v) => v.id === voucherId) ?? null;
}

