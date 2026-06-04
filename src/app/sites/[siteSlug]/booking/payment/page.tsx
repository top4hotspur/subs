import Link from "next/link";
import { getCustomerSiteBookingById } from "@/lib/sites/customer-site-booking-repository";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { formatBookingDateTime } from "@/lib/sites/customer-site-booking-display";
import { createBookingAccessPath } from "@/lib/sites/booking-access-token";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type BookingPaymentReturnPageProps = {
  params: Promise<{ siteSlug: string }>;
  searchParams: Promise<{
    bookingId?: string;
    checkout?: string;
  }>;
};

function statusCopy(checkout: string | undefined, paymentStatus: string | null | undefined) {
  if (paymentStatus === "PAID" || paymentStatus === "PAYMENT_COMPLETED") {
    return {
      title: "Payment received",
      body: "Payment received. Your booking is confirmed.",
      tone: "success" as const,
    };
  }
  if (checkout === "cancelled") {
    return {
      title: "Payment was not completed",
      body: "Payment was not completed. Your booking is not paid. The slot may be held temporarily while secure checkout is still active, then released if payment is not completed.",
      tone: "warning" as const,
    };
  }
  if (paymentStatus === "EXPIRED") {
    return {
      title: "Payment expired",
      body: "Payment was not completed. The temporary booking hold has been released, so please choose a new time or contact the business if you still want this appointment.",
      tone: "warning" as const,
    };
  }
  if (paymentStatus === "FAILED") {
    return {
      title: "Payment failed",
      body: "Payment was not completed. The booking is not paid, so please contact the business or choose another time if you still want this appointment.",
      tone: "warning" as const,
    };
  }
  return {
    title: "Confirming payment",
    body: "Thanks. We are confirming your payment status. Your booking is held while payment confirmation is processed.",
    tone: "info" as const,
  };
}

async function loadBookingSafely(tenantSiteId: string, bookingId?: string) {
  if (!bookingId) return null;
  try {
    return await getCustomerSiteBookingById(tenantSiteId, bookingId);
  } catch {
    return null;
  }
}

export default async function BookingPaymentReturnPage({
  params,
  searchParams,
}: BookingPaymentReturnPageProps) {
  const { siteSlug } = await params;
  const query = await searchParams;
  const site = await getCustomerSitePreviewDataBySlug(siteSlug);
  const booking = site ? await loadBookingSafely(site.tenantSite.id, query.bookingId) : null;
  const publicBasePath = site ? await getPublicSiteBasePath(site.tenantSite.slug) : `/sites/${encodeURIComponent(siteSlug)}`;
  const siteName =
    site?.settings?.siteDisplayName ||
    site?.settings?.businessName ||
    site?.tenantSite.displayName ||
    "This business";
  const copy = statusCopy(query.checkout, booking?.paymentStatus);
  const bookingDetailsHref = site && booking
    ? createBookingAccessPath({
        siteSlug: site.tenantSite.slug,
        tenantSiteId: site.tenantSite.id,
        bookingId: booking.id,
        publicBasePath,
      })
    : null;
  const contactHref = booking
    ? `${buildPublicSitePath(publicBasePath, "contact")}?purpose=${encodeURIComponent("Payment question")}&name=${encodeURIComponent(booking.customerName)}&email=${encodeURIComponent(booking.customerEmail ?? "")}&phone=${encodeURIComponent(booking.customerPhone ?? "")}&bookingId=${encodeURIComponent(booking.id)}`
    : buildPublicSitePath(publicBasePath, "contact");
  const panelClass = copy.tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : copy.tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          {siteName}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{copy.title}</h1>
        <div className={`mt-5 rounded-2xl border p-4 text-sm ${panelClass}`}>
          {copy.body}
        </div>

        {booking ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Booking summary</p>
            <p className="mt-2">Service: {booking.serviceName ?? "Service not set"}</p>
            <p>Date/time: {formatBookingDateTime(booking)}</p>
            <p>Staff: {booking.staffName ?? "Assigned by the business"}</p>
            <p>Payment status: {booking.paymentStatus ?? "Pending"}</p>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            We could not load the booking summary from this link. Please contact the business if
            you need help.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={publicBasePath || "/"}
            className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to website
          </Link>
          <Link
            href={contactHref}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Contact business
          </Link>
          {bookingDetailsHref ? (
            <Link
              href={bookingDetailsHref}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              View booking details
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
