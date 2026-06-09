import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  SiteCustomerLogoutButton,
  SiteCustomerMarketingPreference,
  SiteCustomerProfileForm,
} from "@/components/sites/site-customer-account-forms";
import { TenantSiteShell } from "@/components/sites/tenant-site-shell";
import { getSiteCustomerSessionContext } from "@/lib/auth/site-customer-session";
import { prisma } from "@/lib/db/prisma";
import { createBookingAccessPath } from "@/lib/sites/booking-access-token";
import { formatBookingDateTime } from "@/lib/sites/customer-site-booking-display";
import { getCustomerSiteCustomerById } from "@/lib/sites/customer-site-customer-repository";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type AccountPageProps = {
  params: Promise<{ siteSlug: string }>;
};

const ACTIVE_BOOKING_STATUSES = new Set(["REQUESTED", "SUBMITTED", "CONFIRMED"]);

function statusLabel(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function paymentLabel(paymentStatus: string | null | undefined, paymentMethod: string | null | undefined): string {
  if (paymentStatus === "PAID" || paymentStatus === "PAYMENT_COMPLETED") return "Paid";
  if (paymentStatus === "PENDING" && paymentMethod === "CARD_ONLINE") return "Online payment pending";
  if (paymentStatus === "PENDING") return "Payment to be arranged directly";
  if (paymentStatus === "FAILED") return "Payment failed";
  if (paymentStatus === "REFUNDED") return "Refunded";
  return "No online payment required";
}

export default async function CustomerAccountPage({ params }: AccountPageProps) {
  const { siteSlug } = await params;
  const site = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!site) notFound();
  const publicBasePath = await getPublicSiteBasePath(site.tenantSite.slug);

  const session = await getSiteCustomerSessionContext();
  if (!session || session.tenantSiteId !== site.tenantSite.id || session.tenantSlug !== site.tenantSite.slug) {
    redirect(buildPublicSitePath(publicBasePath, "account/login"));
  }
  const customer = await getCustomerSiteCustomerById(site.tenantSite.id, session.customerId);
  if (!customer) redirect(buildPublicSitePath(publicBasePath, "account/login"));

  const bookings = await prisma.customerSiteBooking.findMany({
    where: {
      tenantSiteId: site.tenantSite.id,
      OR: [
        { customerSiteCustomerId: customer.id },
        { customerEmail: customer.email },
      ],
    },
    orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }, { createdAt: "desc" }],
  });
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter(
    (booking) => ACTIVE_BOOKING_STATUSES.has(booking.status) && (booking.preferredDate ?? "") >= today,
  );
  const past = bookings.filter(
    (booking) => booking.status === "COMPLETED" || ((booking.preferredDate ?? "") < today && booking.status !== "CANCELLED"),
  );
  const cancelled = bookings.filter((booking) => booking.status === "CANCELLED");
  const siteName =
    site.settings?.siteDisplayName ||
    site.settings?.businessName ||
    site.tenantSite.displayName ||
    "This business";
  const policyHref = buildPublicSitePath(publicBasePath, "policy");
  const contactHref = `${buildPublicSitePath(publicBasePath, "contact")}?name=${encodeURIComponent(
    [customer.firstName, customer.lastName].filter(Boolean).join(" "),
  )}&email=${encodeURIComponent(customer.email)}&phone=${encodeURIComponent(customer.phone ?? "")}`;
  const tenantSiteId = site.tenantSite.id;
  const tenantSiteSlug = site.tenantSite.slug;

  function renderBookings(title: string, rows: typeof bookings) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{rows.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No bookings in this section.
            </p>
          ) : rows.map((booking) => {
            const detailHref = createBookingAccessPath({
              siteSlug: tenantSiteSlug,
              tenantSiteId,
              bookingId: booking.id,
              publicBasePath,
            });
            return (
              <article key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{booking.serviceName ?? "Service not set"}</p>
                    <p className="mt-1">{formatBookingDateTime({
                      preferredDate: booking.preferredDate,
                      preferredTime: booking.preferredTime,
                      startDateTime: booking.startDateTime?.toISOString() ?? null,
                    })}</p>
                    <p>Staff: {booking.staffName ?? "Assigned by the business"}</p>
                    <p>Payment: {paymentLabel(booking.paymentStatus, booking.paymentMethod)}</p>
                  </div>
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800">
                    {statusLabel(booking.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={detailHref} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                    View booking details
                  </Link>
                  <Link href={policyHref} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                    Booking policy
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <TenantSiteShell
      siteSlug={site.tenantSite.slug}
      siteName={siteName}
      publicBasePath={publicBasePath}
      domainPrimary={site.tenantSite.domainPrimary}
      phone={site.settings?.phone}
      email={site.settings?.email}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{siteName}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">My bookings</h1>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as {customer.firstName} {customer.lastName ?? ""} ({customer.email}).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={publicBasePath || "/"} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Back to site
            </Link>
            <SiteCustomerLogoutButton siteSlug={site.tenantSite.slug} publicBasePath={publicBasePath} />
          </div>
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Need to change a booking?</p>
          <p className="mt-1">Please contact the business to change your booking. Online rescheduling will be added later.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={contactHref} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">Contact business</Link>
            <Link href={policyHref} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">Booking policy</Link>
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Your account details</p>
          <p className="mt-1">
            These details are saved and will be used to prefill future booking forms.
          </p>
          <SiteCustomerProfileForm siteSlug={site.tenantSite.slug} initialCustomer={customer} />
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Marketing preference</p>
          <p className="mt-1">
            Let us know if you are happy for us to send you offers, updates and reminders.
          </p>
          <SiteCustomerMarketingPreference
            siteSlug={site.tenantSite.slug}
            initialMarketingOptIn={customer.marketingOptIn}
          />
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Special offers</p>
          <p className="mt-1">No offers available right now.</p>
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-950">Payment methods</p>
          <p className="mt-1">
            Saved payment methods will be available when this business connects an online payment provider.
          </p>
        </section>
        <div className="mt-6 grid gap-6">
          {renderBookings("Upcoming bookings", upcoming)}
          {renderBookings("Past bookings", past)}
          {renderBookings("Cancelled bookings", cancelled)}
        </div>
      </div>
    </TenantSiteShell>
  );
}
