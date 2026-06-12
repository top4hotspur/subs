import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSiteBookingById } from "@/lib/sites/customer-site-booking-repository";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { formatBookingDateTime, formatUkDateTime } from "@/lib/sites/customer-site-booking-display";
import { verifyBookingAccessToken } from "@/lib/sites/booking-access-token";
import { cancellationRefundEmailLine } from "@/lib/sites/booking-cancellation-refund";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type CustomerBookingPageProps = {
  params: Promise<{ siteSlug: string; token: string }>;
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

function statusLabel(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function paymentLabel(paymentStatus: string | null | undefined, paymentMethod: string | null | undefined): string {
  if (paymentStatus === "PAID" || paymentStatus === "PAYMENT_COMPLETED") return "Paid";
  if (paymentStatus === "PENDING" && paymentMethod === "CARD_ONLINE") return "Payment pending online";
  if (paymentStatus === "PENDING") return "Payment to be arranged directly";
  if (paymentStatus === "EXPIRED") return "Payment expired";
  if (paymentStatus === "FAILED") return "Payment failed";
  if (paymentStatus === "REFUNDED") return "Refunded";
  return "No online payment required";
}

function canCustomerCancel(booking: {
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  startDateTime: string | null;
}): boolean {
  if (booking.status !== "CONFIRMED" && booking.status !== "REQUESTED" && booking.status !== "SUBMITTED") return false;
  if (booking.paymentStatus === "PAID" || booking.paymentMethod === "CARD_ONLINE") return false;
  if (!booking.startDateTime) return true;
  return new Date(booking.startDateTime).getTime() > Date.now();
}

export default async function CustomerBookingPage({ params, searchParams }: CustomerBookingPageProps) {
  const { siteSlug, token } = await params;
  const query = await searchParams;
  const verified = verifyBookingAccessToken(token);
  if (!verified || verified.siteSlug !== siteSlug) notFound();

  const site = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!site || site.tenantSite.id !== verified.tenantSiteId) notFound();
  const publicBasePath = await getPublicSiteBasePath(site.tenantSite.slug);

  const booking = await getCustomerSiteBookingById(site.tenantSite.id, verified.bookingId);
  if (!booking) notFound();

  const siteName =
    site.settings?.siteDisplayName ||
    site.settings?.businessName ||
    site.tenantSite.displayName ||
    "This business";
  const contactHref = `${buildPublicSitePath(publicBasePath, "contact")}?purpose=${encodeURIComponent("Change my booking")}&name=${encodeURIComponent(booking.customerName)}&email=${encodeURIComponent(booking.customerEmail ?? "")}&phone=${encodeURIComponent(booking.customerPhone ?? "")}&bookingId=${encodeURIComponent(booking.id)}`;
  const policyHref = buildPublicSitePath(publicBasePath, "policy");
  const allowCancel = canCustomerCancel(booking);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          {siteName}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Your booking details</h1>
        <p className="mt-2 text-sm text-slate-600">
          This secure link lets you view this booking without creating a customer account.
        </p>

        {query.cancelled === "1" ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
            Your booking has been cancelled.
          </div>
        ) : null}
        {query.error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
            {query.error === "paid" || query.error === "card"
              ? "Please contact the business to cancel or discuss refunds for this booking."
              : "We could not cancel this booking from the link. Please contact the business."}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Booking</p>
            <p className="mt-2">Status: {statusLabel(booking.status)}</p>
            <p>Service: {booking.serviceName ?? "Service not set"}</p>
            <p>Date/time: {formatBookingDateTime(booking)}</p>
            <p>Staff: {booking.staffName ?? "Assigned by the business"}</p>
            <p>Customer: {booking.customerName}</p>
            {booking.cancelledAt ? <p>Cancelled: {formatUkDateTime(booking.cancelledAt)}</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Payment and policy</p>
            <p className="mt-2">Payment: {paymentLabel(booking.paymentStatus, booking.paymentMethod)}</p>
            <p>Refund status: {statusLabel(booking.refundStatus)}</p>
            {booking.refundGuidance ? <p className="mt-2">{booking.refundGuidance}</p> : null}
            <p className="mt-2">{cancellationRefundEmailLine(booking)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Need to change this booking?</p>
          <p className="mt-2">
            Please contact the business to change your booking. Self-service online rescheduling is
            not enabled for this business yet.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={contactHref} className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Contact business
            </Link>
            <Link href={policyHref} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              View booking policy
            </Link>
          </div>
        </div>

        {allowCancel ? (
          <form method="post" action={`/api/sites/${encodeURIComponent(siteSlug)}/bookings/${encodeURIComponent(token)}/cancel`} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Cancel this booking</p>
            <p className="mt-2">
              You can cancel this booking online because no paid online refund is involved. The
              business will be notified.
            </p>
            <label className="mt-3 block text-xs font-semibold text-amber-950">
              Cancellation note (optional)
              <textarea name="reason" rows={3} className="mt-1 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900" />
            </label>
            <button type="submit" className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Cancel booking
            </button>
          </form>
        ) : booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Cancellation</p>
            <p className="mt-2">
              Please contact the business to cancel or discuss refunds for this booking.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
