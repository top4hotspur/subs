import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { sendTransactionalEmail, type TransactionalEmailResult } from "@/lib/email/email-provider";
import {
  tenantVoucherBusinessNotification,
  tenantVoucherIssuedEmail,
} from "@/lib/email/email-templates";
import {
  formatVoucherMoney,
  normalizeGiftVoucherSettings,
  type CustomerSiteGiftVoucherRecord,
  type CustomerSiteGiftVoucherSettings,
  type VoucherEmailDeliveryStatus,
} from "@/lib/sites/customer-site-voucher-types";
import type { publicGiftVoucherRequestSchema, saveGiftVoucherSettingsSchema } from "@/lib/sites/customer-site-voucher-schema";
import type { z } from "zod";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function serializeVoucher(record: {
  id: string;
  tenantSiteId: string;
  voucherCode: string;
  amountPence: number;
  remainingAmountPence: number | null;
  postageAmountPence: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  deliveryMethod: string;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientAddress: string | null;
  recipientPostcode: string | null;
  message: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  redeemedAt: Date | null;
  redeemedByStaffId: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerSiteGiftVoucherRecord {
  return {
    ...record,
    issuedAt: record.issuedAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    redeemedAt: record.redeemedAt?.toISOString() ?? null,
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function getSiteBaseUrl(): string {
  return getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") || "";
}

function siteSummary(site: {
  slug: string;
  displayName: string;
  customerSiteSettings: { siteDisplayName: string | null; businessName: string | null; email: string | null; phone: string | null } | null;
}) {
  const siteName = site.customerSiteSettings?.siteDisplayName || site.customerSiteSettings?.businessName || site.displayName;
  const base = getSiteBaseUrl();
  return {
    siteName,
    siteSlug: site.slug,
    contactEmail: site.customerSiteSettings?.email ?? null,
    contactPhone: site.customerSiteSettings?.phone ?? null,
    adminUrl: base ? `${base}/site-admin/${encodeURIComponent(site.slug)}` : `/site-admin/${site.slug}`,
    voucherUrl: base ? `${base}/sites/${encodeURIComponent(site.slug)}/vouchers` : `/sites/${site.slug}/vouchers`,
  };
}

function emailStatus(result: TransactionalEmailResult): "SENT" | "SKIPPED" | "FAILED" {
  if (result.ok) return "SENT";
  if (result.skipped) return "SKIPPED";
  return "FAILED";
}

async function sendBusinessNotification(
  voucher: CustomerSiteGiftVoucherRecord,
  site: Awaited<ReturnType<typeof getTenantSiteForVouchers>>,
): Promise<"SENT" | "SKIPPED" | "FAILED"> {
  const summary = siteSummary(site);
  if (!summary.contactEmail) return "SKIPPED";
  const template = tenantVoucherBusinessNotification(voucher, summary);
  return emailStatus(await sendTransactionalEmail({
    to: summary.contactEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
  }));
}

async function sendIssuedEmails(
  voucher: CustomerSiteGiftVoucherRecord,
  site: Awaited<ReturnType<typeof getTenantSiteForVouchers>>,
): Promise<VoucherEmailDeliveryStatus> {
  const summary = siteSummary(site);
  const statuses: VoucherEmailDeliveryStatus = {};
  const purchaserTemplate = tenantVoucherIssuedEmail(voucher, summary, "purchaser");
  statuses.purchaserEmail = emailStatus(await sendTransactionalEmail({
    to: voucher.purchaserEmail,
    subject: purchaserTemplate.subject,
    text: purchaserTemplate.text,
    html: purchaserTemplate.html,
  }));

  if (voucher.deliveryMethod === "DIGITAL_EMAIL" && voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
    const recipientTemplate = tenantVoucherIssuedEmail(voucher, summary, "recipient");
    statuses.recipientEmail = emailStatus(await sendTransactionalEmail({
      to: voucher.recipientEmail,
      subject: recipientTemplate.subject,
      text: recipientTemplate.text,
      html: recipientTemplate.html,
    }));
  } else {
    statuses.recipientEmail = "SKIPPED";
  }
  return statuses;
}

export async function getTenantSiteForVouchers(tenantSiteId: string) {
  const site = await prisma.tenantSite.findUnique({
    where: { id: tenantSiteId },
    include: { customerSiteSettings: true },
  });
  if (!site) throw new Error("Tenant site not found");
  return site;
}

export async function getVoucherSettings(tenantSiteId: string): Promise<CustomerSiteGiftVoucherSettings> {
  const settings = await prisma.customerSiteSettings.findUnique({
    where: { tenantSiteId },
    select: { giftVoucherSettingsJson: true },
  });
  return normalizeGiftVoucherSettings(settings?.giftVoucherSettingsJson);
}

export async function saveVoucherSettings(
  tenantSiteId: string,
  input: z.infer<typeof saveGiftVoucherSettingsSchema>,
): Promise<CustomerSiteGiftVoucherSettings> {
  const normalized = normalizeGiftVoucherSettings(input);
  await prisma.customerSiteSettings.upsert({
    where: { tenantSiteId },
    create: {
      tenantSiteId,
      giftVoucherSettingsJson: toJson(normalized),
    },
    update: {
      giftVoucherSettingsJson: toJson(normalized),
    },
  });
  return normalized;
}

export async function listGiftVouchers(tenantSiteId: string): Promise<CustomerSiteGiftVoucherRecord[]> {
  const vouchers = await prisma.customerSiteGiftVoucher.findMany({
    where: { tenantSiteId },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
  return vouchers.map(serializeVoucher);
}

function normalizeVoucherCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function siteCodePrefix(siteNameOrSlug: string): string {
  const cleaned = siteNameOrSlug.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (cleaned || "GIFT").slice(0, 4);
}

async function generateVoucherCode(tenantSiteId: string, siteNameOrSlug: string): Promise<string> {
  const prefix = siteCodePrefix(siteNameOrSlug);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const code = `${prefix}-${suffix}`;
    const existing = await prisma.customerSiteGiftVoucher.findUnique({
      where: { tenantSiteId_voucherCode: { tenantSiteId, voucherCode: code } },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique voucher code");
}

function addValidityMonths(date: Date, validityMonths: number | null): Date | null {
  if (!validityMonths) return null;
  const next = new Date(date);
  next.setMonth(next.getMonth() + validityMonths);
  return next;
}

function validateAmount(settings: CustomerSiteGiftVoucherSettings, amountGbp: number): void {
  const preset = settings.presetValuesGbp.includes(amountGbp);
  const custom = settings.allowCustomAmount && amountGbp >= settings.minCustomAmountGbp && amountGbp <= settings.maxCustomAmountGbp;
  if (!preset && !custom) throw new Error("VOUCHER_AMOUNT_NOT_ALLOWED");
}

export async function createPendingGiftVoucher(
  tenantSiteId: string,
  input: z.infer<typeof publicGiftVoucherRequestSchema>,
): Promise<{ voucher: CustomerSiteGiftVoucherRecord; emailStatus: VoucherEmailDeliveryStatus }> {
  const site = await getTenantSiteForVouchers(tenantSiteId);
  const settings = normalizeGiftVoucherSettings(site.customerSiteSettings?.giftVoucherSettingsJson);
  if (!settings.enabled || !settings.publicVisible) throw new Error("GIFT_VOUCHERS_NOT_ENABLED");
  if (!settings.deliveryMethods.includes(input.deliveryMethod)) throw new Error("VOUCHER_DELIVERY_METHOD_NOT_ALLOWED");
  validateAmount(settings, input.amountGbp);
  if (input.deliveryMethod === "DIGITAL_EMAIL" && !input.recipientEmail) throw new Error("RECIPIENT_EMAIL_REQUIRED");
  if (input.deliveryMethod === "POST" && !input.recipientAddress) throw new Error("RECIPIENT_ADDRESS_REQUIRED");

  const voucherCode = await generateVoucherCode(tenantSiteId, site.customerSiteSettings?.siteDisplayName || site.displayName || site.slug);
  const record = await prisma.customerSiteGiftVoucher.create({
    data: {
      tenantSiteId,
      voucherCode,
      amountPence: input.amountGbp * 100,
      remainingAmountPence: input.amountGbp * 100,
      postageAmountPence: input.deliveryMethod === "POST" ? settings.postageChargeGbp * 100 : 0,
      currency: "GBP",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentMethod: "MANUAL",
      deliveryMethod: input.deliveryMethod,
      purchaserName: input.purchaserName,
      purchaserEmail: input.purchaserEmail.toLowerCase(),
      purchaserPhone: input.purchaserPhone?.trim() || null,
      recipientName: input.recipientName?.trim() || null,
      recipientEmail: input.recipientEmail?.toLowerCase().trim() || null,
      recipientAddress: input.recipientAddress?.trim() || null,
      recipientPostcode: input.recipientPostcode?.trim() || null,
      message: input.message?.trim() || null,
    },
  });
  const voucher = serializeVoucher(record);
  const emailStatus: VoucherEmailDeliveryStatus = {
    businessNotification: await sendBusinessNotification(voucher, site),
  };
  return { voucher, emailStatus };
}

export async function getGiftVoucherByCode(tenantSiteId: string, code: string): Promise<CustomerSiteGiftVoucherRecord | null> {
  const voucher = await prisma.customerSiteGiftVoucher.findFirst({
    where: { tenantSiteId, voucherCode: normalizeVoucherCode(code) },
  });
  return voucher ? serializeVoucher(voucher) : null;
}

export async function runGiftVoucherAdminAction(
  tenantSiteId: string,
  voucherId: string,
  action: "MARK_PAYMENT_RECEIVED" | "MARK_REDEEMED" | "CANCEL" | "MARK_EXPIRED" | "RESEND_EMAIL",
  staffMemberId?: string | null,
): Promise<{ voucher: CustomerSiteGiftVoucherRecord; emailStatus: VoucherEmailDeliveryStatus }> {
  const site = await getTenantSiteForVouchers(tenantSiteId);
  const current = await prisma.customerSiteGiftVoucher.findFirst({ where: { tenantSiteId, id: voucherId } });
  if (!current) throw new Error("VOUCHER_NOT_FOUND");

  let updated = current;
  let emailStatus: VoucherEmailDeliveryStatus = {};
  const now = new Date();
  const settings = normalizeGiftVoucherSettings(site.customerSiteSettings?.giftVoucherSettingsJson);

  if (action === "MARK_PAYMENT_RECEIVED") {
    updated = await prisma.customerSiteGiftVoucher.update({
      where: { id: current.id },
      data: {
        paymentStatus: "PAID",
        status: "ACTIVE",
        issuedAt: current.issuedAt ?? now,
        expiresAt: current.expiresAt ?? addValidityMonths(now, settings.validityMonths),
      },
    });
    emailStatus = await sendIssuedEmails(serializeVoucher(updated), site);
  } else if (action === "MARK_REDEEMED") {
    if (current.status !== "ACTIVE") throw new Error("VOUCHER_NOT_ACTIVE");
    updated = await prisma.customerSiteGiftVoucher.update({
      where: { id: current.id },
      data: {
        status: "REDEEMED",
        remainingAmountPence: 0,
        redeemedAt: now,
        redeemedByStaffId: staffMemberId ?? null,
      },
    });
  } else if (action === "CANCEL") {
    if (current.status === "REDEEMED") throw new Error("REDEEMED_VOUCHER_CANNOT_BE_CANCELLED");
    updated = await prisma.customerSiteGiftVoucher.update({
      where: { id: current.id },
      data: { status: "CANCELLED", paymentStatus: current.paymentStatus === "PAID" ? current.paymentStatus : "CANCELLED", cancelledAt: now },
    });
  } else if (action === "MARK_EXPIRED") {
    if (current.status === "REDEEMED") throw new Error("REDEEMED_VOUCHER_CANNOT_EXPIRE");
    updated = await prisma.customerSiteGiftVoucher.update({
      where: { id: current.id },
      data: { status: "EXPIRED" },
    });
  } else if (action === "RESEND_EMAIL") {
    if (current.status !== "ACTIVE" || current.paymentStatus !== "PAID") throw new Error("VOUCHER_EMAIL_REQUIRES_ACTIVE_PAID");
    emailStatus = await sendIssuedEmails(serializeVoucher(current), site);
  }

  return { voucher: serializeVoucher(updated), emailStatus };
}

export function voucherStaffSummary(voucher: CustomerSiteGiftVoucherRecord) {
  return {
    id: voucher.id,
    voucherCode: voucher.voucherCode,
    amount: formatVoucherMoney(voucher.amountPence, voucher.currency),
    remaining: formatVoucherMoney(voucher.remainingAmountPence ?? voucher.amountPence, voucher.currency),
    status: voucher.status,
    paymentStatus: voucher.paymentStatus,
    deliveryMethod: voucher.deliveryMethod,
    recipientName: voucher.recipientName,
    expiresAt: voucher.expiresAt,
    redeemedAt: voucher.redeemedAt,
  };
}
