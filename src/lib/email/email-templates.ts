import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";

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
};

type BusinessAdminAccessEmailInput = {
  businessName: string;
  siteSlug: string;
  loginUrl: string;
  adminEmail: string;
  accessCode: string;
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
  const subject = `${site.siteName}: booking request received`;
  const text = [
    `Thanks for your booking request with ${site.siteName}.`,
    "",
    `Service: ${booking.serviceName || "-"}`,
    `Date: ${booking.preferredDate || "-"}`,
    `Time: ${booking.preferredTime || "-"}`,
    `Staff: ${booking.staffName || "-"}`,
    "",
    "We will confirm your booking details shortly.",
  ].join("\n");
  const html = `<p>Thanks for your booking request with <strong>${escapeHtml(site.siteName)}</strong>.</p>
<p><strong>Service:</strong> ${escapeHtml(booking.serviceName || "-")}<br/>
<strong>Date:</strong> ${escapeHtml(booking.preferredDate || "-")}<br/>
<strong>Time:</strong> ${escapeHtml(booking.preferredTime || "-")}<br/>
<strong>Staff:</strong> ${escapeHtml(booking.staffName || "-")}</p>
<p>We will confirm your booking details shortly.</p>`;
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
