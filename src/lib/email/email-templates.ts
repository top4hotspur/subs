import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import { formatBookingDateTime } from "@/lib/sites/customer-site-booking-display";
import { cancellationRefundEmailLine } from "@/lib/sites/booking-cancellation-refund";
import type { CustomerSiteGiftVoucherRecord } from "@/lib/sites/customer-site-voucher-types";
import { formatVoucherMoney } from "@/lib/sites/customer-site-voucher-types";

type ContactEnquiryEmailInput = {
  name: string;
  businessName?: string | null;
  email: string;
  phone?: string | null;
  industrySlug?: string | null;
  message: string;
  source?: string | null;
  createdAt?: Date | string;
};

type SiteSummaryForEmail = {
  siteName: string;
  siteSlug?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  adminUrl?: string | null;
  bookingUrl?: string | null;
};

type BusinessAdminAccessEmailInput = {
  businessName: string;
  siteSlug: string;
  loginUrl: string;
  adminEmail: string;
  accessCode: string;
};

type SiteGoLiveEmailInput = {
  businessName: string;
  publicUrl: string;
  adminUrl: string;
};

type VoucherSiteSummaryForEmail = SiteSummaryForEmail & {
  voucherUrl?: string | null;
};

export function contactEnquiryAdminNotification(enquiry: ContactEnquiryEmailInput) {
  const subject = `New contact enquiry - ${enquiry.name}`;
  const text = [
    "New contact enquiry received.",
    "",
    `Name: ${enquiry.name}`,
    `Business: ${enquiry.businessName || "-"}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone || "-"}`,
    `Industry: ${enquiry.industrySlug || "-"}`,
    `Source: ${enquiry.source || "contact-page"}`,
    "",
    "Message:",
    enquiry.message,
  ].join("\n");
  const html = `<p><strong>New contact enquiry received.</strong></p>
<p><strong>Name:</strong> ${escapeHtml(enquiry.name)}<br/>
<strong>Business:</strong> ${escapeHtml(enquiry.businessName || "-")}<br/>
<strong>Email:</strong> ${escapeHtml(enquiry.email)}<br/>
<strong>Phone:</strong> ${escapeHtml(enquiry.phone || "-")}<br/>
<strong>Industry:</strong> ${escapeHtml(enquiry.industrySlug || "-")}<br/>
<strong>Source:</strong> ${escapeHtml(enquiry.source || "contact-page")}</p>
<p><strong>Message:</strong><br/>${escapeHtml(enquiry.message).replace(/\n/g, "<br/>")}</p>`;
  return { subject, text, html };
}

export function setupRequestCustomerConfirmation(
  setupRequest: SetupRequestEmailInput,
  confirmationUrl: string,
) {
  const subject = "MyExperiment.club setup request confirmation";
  const text = [
    `Hi ${setupRequest.contactName || setupRequest.businessName},`,
    "",
    "Thanks for submitting your setup request to MyExperiment.club.",
    `Business: ${setupRequest.businessName}`,
    `Industry: ${setupRequest.industrySlug}`,
    "",
    `Review your setup request: ${confirmationUrl}`,
    "",
    "Next step: we will confirm your domain details and payment setup before your site goes live.",
  ].join("\n");
  const html = `<p>Hi ${escapeHtml(setupRequest.contactName || setupRequest.businessName)},</p>
<p>Thanks for submitting your setup request to <strong>MyExperiment.club</strong>.</p>
<p><strong>Business:</strong> ${escapeHtml(setupRequest.businessName)}<br/>
<strong>Industry:</strong> ${escapeHtml(setupRequest.industrySlug)}</p>
<p><a href="${escapeHtml(confirmationUrl)}">Review your setup request</a></p>
<p>Next step: we will confirm your domain details and payment setup before your site goes live.</p>`;
  return { subject, text, html };
}

export function setupRequestAdminNotification(setupRequest: SetupRequestEmailInput) {
  const subject = `New setup request - ${setupRequest.businessName}`;
  const text = [
    "A new setup request has been submitted.",
    "",
    `Business: ${setupRequest.businessName}`,
    `Industry: ${setupRequest.industrySlug}`,
    `Contact: ${setupRequest.contactName || "-"}`,
    `Email: ${setupRequest.contactEmail || "-"}`,
    `Phone: ${setupRequest.contactPhone || "-"}`,
    `Domain option: ${setupRequest.domainOption}`,
    `Created: ${String(setupRequest.createdAt)}`,
  ].join("\n");
  const html = `<p><strong>A new setup request has been submitted.</strong></p>
<p><strong>Business:</strong> ${escapeHtml(setupRequest.businessName)}<br/>
<strong>Industry:</strong> ${escapeHtml(setupRequest.industrySlug)}<br/>
<strong>Contact:</strong> ${escapeHtml(setupRequest.contactName || "-")}<br/>
<strong>Email:</strong> ${escapeHtml(setupRequest.contactEmail || "-")}<br/>
<strong>Phone:</strong> ${escapeHtml(setupRequest.contactPhone || "-")}<br/>
<strong>Domain option:</strong> ${escapeHtml(setupRequest.domainOption)}</p>`;
  return { subject, text, html };
}

export function tenantBookingCustomerConfirmation(
  booking: CustomerSiteBookingRecord,
  site: SiteSummaryForEmail,
) {
  const subject = booking.paymentStatus === "PENDING" && booking.paymentMethod === "CARD_ONLINE"
    ? "Your booking is pending payment"
    : "Your booking is confirmed";
  const appointment = formatBookingDateTime(booking);
  const paymentLine =
    booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED"
      ? "Payment has been received online."
      : booking.paymentStatus === "PENDING" && booking.paymentMethod === "CARD_ONLINE"
        ? "Payment is pending. Please complete secure checkout if you have not already done so."
        : booking.paymentStatus === "PENDING"
          ? "Payment is pending and will be arranged directly with the business."
          : "Payment has not been taken online yet.";
  const text = [
    booking.paymentStatus === "PENDING" && booking.paymentMethod === "CARD_ONLINE"
      ? `Your booking with ${site.siteName} is pending payment.`
      : `Your booking with ${site.siteName} is confirmed.`,
    "",
    `Service: ${booking.serviceName || "-"}`,
    `Date/time: ${appointment}`,
    `Staff: ${booking.staffName || "-"}`,
    site.contactEmail ? `Business email: ${site.contactEmail}` : "",
    site.contactPhone ? `Business phone: ${site.contactPhone}` : "",
    site.bookingUrl ? `View your booking details here: ${site.bookingUrl}` : "",
    "",
    paymentLine,
    "Please check the booking and cancellation policy if you need to change or cancel this appointment.",
  ].filter(Boolean).join("\n");
  const html = `<p>Your booking with <strong>${escapeHtml(site.siteName)}</strong> ${booking.paymentStatus === "PENDING" && booking.paymentMethod === "CARD_ONLINE" ? "is pending payment." : "is confirmed."}</p>
<p><strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Date/time:</strong> ${escapeHtml(appointment)}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}</p>
${site.contactEmail || site.contactPhone ? `<p><strong>Business contact:</strong><br/>${site.contactEmail ? `Email: ${escapeHtml(site.contactEmail)}<br/>` : ""}${site.contactPhone ? `Phone: ${escapeHtml(site.contactPhone)}` : ""}</p>` : ""}
${site.bookingUrl ? `<p><a href="${escapeHtml(site.bookingUrl)}">View your booking details here</a></p>` : ""}
<p>${escapeHtml(paymentLine)}</p>
<p>Please check the booking and cancellation policy if you need to change or cancel this appointment.</p>`;
  return { subject, text, html };
}

export function tenantBookingBusinessNotification(
  booking: CustomerSiteBookingRecord,
  site: SiteSummaryForEmail,
) {
  const subject = `New confirmed booking for ${site.siteName}`;
  const appointment = formatBookingDateTime(booking);
  const text = [
    `New confirmed booking for ${site.siteName}.`,
    "",
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail || "-"}`,
    `Phone: ${booking.customerPhone || "-"}`,
    `Service: ${booking.serviceName || "-"}`,
    `Staff: ${booking.staffName || "-"}`,
    `Date/time: ${appointment}`,
    `Payment: ${formatBookingPaymentForEmail(booking)}`,
    `Notes: ${booking.notes || "-"}`,
    site.adminUrl ? `Open admin: ${site.adminUrl}` : "",
  ].filter(Boolean).join("\n");
  const html = `<p><strong>New confirmed booking for ${escapeHtml(site.siteName)}.</strong></p>
<p><strong>Customer:</strong> ${escapeHtml(booking.customerName)}<br/>
<strong>Email:</strong> ${escapeHtml(booking.customerEmail || "-")}<br/>
<strong>Phone:</strong> ${escapeHtml(booking.customerPhone || "-")}<br/>
<strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}<br/>
<strong>Date/time:</strong> ${escapeHtml(appointment)}<br/>
<strong>Payment:</strong> ${escapeHtml(formatBookingPaymentForEmail(booking))}<br/>
<strong>Notes:</strong> ${escapeHtml(booking.notes || "-")}</p>
${site.adminUrl ? `<p><a href="${escapeHtml(site.adminUrl)}">Open booking in site admin</a></p>` : ""}`;
  return { subject, text, html };
}

export function tenantBookingBusinessCancellationNotification(
  booking: CustomerSiteBookingRecord,
  site: SiteSummaryForEmail,
) {
  const subject = `Booking cancelled - ${site.siteName}`;
  const appointment = formatBookingDateTime(booking);
  const text = [
    `A booking has been cancelled for ${site.siteName}.`,
    "",
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail || "-"}`,
    `Phone: ${booking.customerPhone || "-"}`,
    `Service: ${booking.serviceName || "-"}`,
    `Staff: ${booking.staffName || "-"}`,
    `Date/time: ${appointment}`,
    `Payment: ${formatBookingPaymentForEmail(booking)}`,
    `Refund status: ${booking.refundStatus || "-"}`,
    booking.cancellationReason ? `Cancellation note: ${booking.cancellationReason}` : "",
    site.adminUrl ? `Open admin: ${site.adminUrl}` : "",
  ].filter(Boolean).join("\n");
  const html = `<p><strong>A booking has been cancelled for ${escapeHtml(site.siteName)}.</strong></p>
<p><strong>Customer:</strong> ${escapeHtml(booking.customerName)}<br/>
<strong>Email:</strong> ${escapeHtml(booking.customerEmail || "-")}<br/>
<strong>Phone:</strong> ${escapeHtml(booking.customerPhone || "-")}<br/>
<strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}<br/>
<strong>Date/time:</strong> ${escapeHtml(appointment)}<br/>
<strong>Payment:</strong> ${escapeHtml(formatBookingPaymentForEmail(booking))}<br/>
<strong>Refund status:</strong> ${escapeHtml(booking.refundStatus || "-")}</p>
${booking.cancellationReason ? `<p><strong>Cancellation note:</strong><br/>${escapeHtml(booking.cancellationReason).replace(/\n/g, "<br/>")}</p>` : ""}
${site.adminUrl ? `<p><a href="${escapeHtml(site.adminUrl)}">Open booking in site admin</a></p>` : ""}`;
  return { subject, text, html };
}

function formatBookingPaymentForEmail(booking: CustomerSiteBookingRecord): string {
  if (booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED") return "Paid";
  if (booking.paymentStatus === "PENDING" || booking.paymentStatus === "PAYMENT_REQUIRED") {
    if (booking.paymentMethod === "CASH") return "Cash/manual payment expected";
    if (booking.paymentMethod === "CARD_ONLINE") return "Online payment pending";
    return "Payment pending";
  }
  if (booking.paymentStatus === "FAILED") return "Payment failed";
  if (booking.paymentStatus === "REFUNDED") return "Refunded";
  return "Payment not required";
}

export function tenantBookingCustomerCancellation(
  booking: CustomerSiteBookingRecord,
  site: SiteSummaryForEmail,
) {
  const subject = "Your booking has been cancelled";
  const appointment = formatBookingDateTime(booking);
  const refundLine = cancellationRefundEmailLine(booking);
  const text = [
    `Your booking with ${site.siteName} has been cancelled.`,
    "",
    `Service: ${booking.serviceName || "-"}`,
    `Date/time: ${appointment}`,
    `Staff: ${booking.staffName || "-"}`,
    booking.cancellationReason ? `Cancellation note: ${booking.cancellationReason}` : "",
    "",
    refundLine,
    "",
    site.contactEmail ? `Business email: ${site.contactEmail}` : "",
    site.contactPhone ? `Business phone: ${site.contactPhone}` : "",
    site.bookingUrl ? `View your booking details here: ${site.bookingUrl}` : "",
    "Please contact the business if you have any questions.",
  ].filter(Boolean).join("\n");
  const html = `<p>Your booking with <strong>${escapeHtml(site.siteName)}</strong> has been cancelled.</p>
<p><strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Date/time:</strong> ${escapeHtml(appointment)}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}</p>
${booking.cancellationReason ? `<p><strong>Cancellation note:</strong><br/>${escapeHtml(booking.cancellationReason).replace(/\n/g, "<br/>")}</p>` : ""}
<p>${escapeHtml(refundLine)}</p>
${site.contactEmail || site.contactPhone ? `<p>${site.contactEmail ? `Email: ${escapeHtml(site.contactEmail)}<br/>` : ""}${site.contactPhone ? `Phone: ${escapeHtml(site.contactPhone)}` : ""}</p>` : ""}
${site.bookingUrl ? `<p><a href="${escapeHtml(site.bookingUrl)}">View your booking details here</a></p>` : ""}
<p>Please contact the business if you have any questions.</p>`;
  return { subject, text, html };
}

export function tenantBookingCustomerUpdated(
  booking: CustomerSiteBookingRecord,
  site: SiteSummaryForEmail,
) {
  const subject = "Your booking has been updated";
  const appointment = formatBookingDateTime(booking);
  const text = [
    `Your booking with ${site.siteName} has been updated.`,
    "",
    `Service: ${booking.serviceName || "-"}`,
    `Date/time: ${appointment}`,
    `Staff: ${booking.staffName || "-"}`,
    "",
    site.contactEmail ? `Business email: ${site.contactEmail}` : "",
    site.contactPhone ? `Business phone: ${site.contactPhone}` : "",
    site.bookingUrl ? `View your booking details here: ${site.bookingUrl}` : "",
    "Please contact the business if you have any questions.",
  ].filter(Boolean).join("\n");
  const html = `<p>Your booking with <strong>${escapeHtml(site.siteName)}</strong> has been updated.</p>
<p><strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Date/time:</strong> ${escapeHtml(appointment)}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}</p>
${site.contactEmail || site.contactPhone ? `<p>${site.contactEmail ? `Email: ${escapeHtml(site.contactEmail)}<br/>` : ""}${site.contactPhone ? `Phone: ${escapeHtml(site.contactPhone)}` : ""}</p>` : ""}
${site.bookingUrl ? `<p><a href="${escapeHtml(site.bookingUrl)}">View your booking details here</a></p>` : ""}
<p>Please contact the business if you have any questions.</p>`;
  return { subject, text, html };
}

export function businessAdminAccessHandoverEmail(input: BusinessAdminAccessEmailInput) {
  const subject = `Your ${input.businessName} website admin access`;
  const text = [
    `Hi,`,
    "",
    `Your business admin access is ready for ${input.businessName}.`,
    "",
    `Business name: ${input.businessName}`,
    `Site slug: ${input.siteSlug}`,
    `Business admin login URL: ${input.loginUrl}`,
    `Admin email: ${input.adminEmail}`,
    `One-time access code: ${input.accessCode}`,
    "",
    "Keep this access code private. If it is exposed, request a reset immediately.",
    "Please keep an eye on your inbox and check junk/spam if future emails are not seen.",
    "",
    "If you need help, contact MyExperiment.club support.",
  ].join("\n");

  const html = `<p>Hi,</p>
<p>Your business admin access is ready for <strong>${escapeHtml(input.businessName)}</strong>.</p>
<p><strong>Business name:</strong> ${escapeHtml(input.businessName)}<br/>
<strong>Site slug:</strong> ${escapeHtml(input.siteSlug)}<br/>
<strong>Business admin login URL:</strong> <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a><br/>
<strong>Admin email:</strong> ${escapeHtml(input.adminEmail)}<br/>
<strong>One-time access code:</strong> ${escapeHtml(input.accessCode)}</p>
<p>Keep this access code private. If it is exposed, request a reset immediately.</p>
<p>Please keep an eye on your inbox and check junk/spam if future emails are not seen.</p>
<p>If you need help, contact MyExperiment.club support.</p>`;
  return { subject, text, html };
}

export function siteGoLiveCustomerEmail(input: SiteGoLiveEmailInput) {
  const subject = "Your website is live";
  const text = [
    "Hi,",
    "",
    `Your website for ${input.businessName} is live.`,
    "",
    `Public website: ${input.publicUrl}`,
    `Business admin: ${input.adminUrl}`,
    "",
    "You can continue updating your services, prices, staff, opening hours, policies and page content from your business admin area.",
    "If you need help with domain steps, setup questions, or going live checks, MyExperiment.club support is available.",
    "",
    "MyExperiment.club",
  ].join("\n");

  const html = `<p>Hi,</p>
<p>Your website for <strong>${escapeHtml(input.businessName)}</strong> is live.</p>
<p><strong>Public website:</strong> <a href="${escapeHtml(input.publicUrl)}">${escapeHtml(input.publicUrl)}</a><br/>
<strong>Business admin:</strong> <a href="${escapeHtml(input.adminUrl)}">${escapeHtml(input.adminUrl)}</a></p>
<p>You can continue updating your services, prices, staff, opening hours, policies and page content from your business admin area.</p>
<p>If you need help with domain steps, setup questions, or going live checks, MyExperiment.club support is available.</p>
<p>MyExperiment.club</p>`;
  return { subject, text, html };
}

export function tenantVoucherBusinessNotification(
  voucher: CustomerSiteGiftVoucherRecord,
  site: VoucherSiteSummaryForEmail,
) {
  const totalDue = voucher.amountPence + voucher.postageAmountPence;
  const subject = `New gift voucher request - ${site.siteName}`;
  const text = [
    `New gift voucher request for ${site.siteName}.`,
    "",
    `Voucher code: ${voucher.voucherCode}`,
    `Value: ${formatVoucherMoney(voucher.amountPence, voucher.currency)}`,
    voucher.postageAmountPence > 0 ? `Postage: ${formatVoucherMoney(voucher.postageAmountPence, voucher.currency)}` : "",
    `Total due: ${formatVoucherMoney(totalDue, voucher.currency)}`,
    `Delivery: ${voucher.deliveryMethod.replaceAll("_", " ").toLowerCase()}`,
    `Purchaser: ${voucher.purchaserName} <${voucher.purchaserEmail}>`,
    voucher.purchaserPhone ? `Purchaser phone: ${voucher.purchaserPhone}` : "",
    voucher.recipientName ? `Recipient: ${voucher.recipientName}` : "",
    voucher.recipientEmail ? `Recipient email: ${voucher.recipientEmail}` : "",
    voucher.recipientAddress ? `Recipient address: ${voucher.recipientAddress}` : "",
    voucher.recipientPostcode ? `Recipient postcode: ${voucher.recipientPostcode}` : "",
    voucher.message ? `Message: ${voucher.message}` : "",
    "",
    "Payment has not been taken online yet. Mark payment received in business admin before treating the voucher as active.",
    site.adminUrl ? `Open business admin: ${site.adminUrl}` : "",
  ].filter(Boolean).join("\n");
  const html = `<p><strong>New gift voucher request for ${escapeHtml(site.siteName)}.</strong></p>
<p><strong>Voucher code:</strong> ${escapeHtml(voucher.voucherCode)}<br/>
<strong>Value:</strong> ${escapeHtml(formatVoucherMoney(voucher.amountPence, voucher.currency))}<br/>
${voucher.postageAmountPence > 0 ? `<strong>Postage:</strong> ${escapeHtml(formatVoucherMoney(voucher.postageAmountPence, voucher.currency))}<br/>` : ""}
<strong>Total due:</strong> ${escapeHtml(formatVoucherMoney(totalDue, voucher.currency))}<br/>
<strong>Delivery:</strong> ${escapeHtml(voucher.deliveryMethod.replaceAll("_", " ").toLowerCase())}</p>
<p><strong>Purchaser:</strong> ${escapeHtml(voucher.purchaserName)} &lt;${escapeHtml(voucher.purchaserEmail)}&gt;<br/>
${voucher.purchaserPhone ? `<strong>Purchaser phone:</strong> ${escapeHtml(voucher.purchaserPhone)}<br/>` : ""}
${voucher.recipientName ? `<strong>Recipient:</strong> ${escapeHtml(voucher.recipientName)}<br/>` : ""}
${voucher.recipientEmail ? `<strong>Recipient email:</strong> ${escapeHtml(voucher.recipientEmail)}<br/>` : ""}
${voucher.recipientAddress ? `<strong>Recipient address:</strong> ${escapeHtml(voucher.recipientAddress)}<br/>` : ""}
${voucher.recipientPostcode ? `<strong>Recipient postcode:</strong> ${escapeHtml(voucher.recipientPostcode)}<br/>` : ""}</p>
${voucher.message ? `<p><strong>Message:</strong><br/>${escapeHtml(voucher.message).replace(/\n/g, "<br/>")}</p>` : ""}
<p>Payment has not been taken online yet. Mark payment received in business admin before treating the voucher as active.</p>
${site.adminUrl ? `<p><a href="${escapeHtml(site.adminUrl)}">Open business admin</a></p>` : ""}`;
  return { subject, text, html };
}

export function tenantVoucherIssuedEmail(
  voucher: CustomerSiteGiftVoucherRecord,
  site: VoucherSiteSummaryForEmail,
  recipientType: "purchaser" | "recipient",
) {
  const subject = `Your ${site.siteName} gift voucher`;
  const greeting =
    recipientType === "recipient"
      ? voucher.recipientName || "there"
      : voucher.purchaserName || "there";
  const expiry = voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("en-GB") : "No fixed expiry date";
  const text = [
    `Hi ${greeting},`,
    "",
    `Your gift voucher for ${site.siteName} is now active.`,
    "",
    `Voucher code: ${voucher.voucherCode}`,
    `Value: ${formatVoucherMoney(voucher.amountPence, voucher.currency)}`,
    `Expiry: ${expiry}`,
    voucher.message ? `Message: ${voucher.message}` : "",
    "",
    "Keep this code safe. The business may ask for it when booking or redeeming the voucher.",
    site.voucherUrl ? `Gift voucher page: ${site.voucherUrl}` : "",
    site.contactEmail ? `Business email: ${site.contactEmail}` : "",
    site.contactPhone ? `Business phone: ${site.contactPhone}` : "",
  ].filter(Boolean).join("\n");
  const html = `<p>Hi ${escapeHtml(greeting)},</p>
<p>Your gift voucher for <strong>${escapeHtml(site.siteName)}</strong> is now active.</p>
<p><strong>Voucher code:</strong> ${escapeHtml(voucher.voucherCode)}<br/>
<strong>Value:</strong> ${escapeHtml(formatVoucherMoney(voucher.amountPence, voucher.currency))}<br/>
<strong>Expiry:</strong> ${escapeHtml(expiry)}</p>
${voucher.message ? `<p><strong>Message:</strong><br/>${escapeHtml(voucher.message).replace(/\n/g, "<br/>")}</p>` : ""}
<p>Keep this code safe. The business may ask for it when booking or redeeming the voucher.</p>
${site.voucherUrl ? `<p><a href="${escapeHtml(site.voucherUrl)}">Open gift voucher page</a></p>` : ""}
${site.contactEmail || site.contactPhone ? `<p>${site.contactEmail ? `Email: ${escapeHtml(site.contactEmail)}<br/>` : ""}${site.contactPhone ? `Phone: ${escapeHtml(site.contactPhone)}` : ""}</p>` : ""}`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SetupRequestEmailInput = {
  businessName: string;
  industrySlug: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  domainOption: string;
  createdAt: string | Date;
};
