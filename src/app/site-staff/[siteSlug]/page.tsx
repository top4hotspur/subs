import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  MarkBookingCompletedButton,
  StaffVoucherLookup,
  SiteStaffLogoutButton,
} from "@/components/site-staff/staff-diary-actions";
import { getSiteStaffSessionContext } from "@/lib/auth/site-staff-session";
import { prisma } from "@/lib/db/prisma";
import { formatBookingDateTime } from "@/lib/sites/customer-site-booking-display";
import { listCustomerSiteBookings } from "@/lib/sites/customer-site-booking-repository";
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import { normalizeStaffPermissions } from "@/lib/sites/customer-site-staff-repository";
import type { CustomerSiteStaffPermissions } from "@/lib/sites/customer-site-staff-types";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

type SiteStaffPageProps = {
  params: Promise<{ siteSlug: string }>;
  searchParams: Promise<{ staffId?: string }>;
};

const ACTIVE_STATUSES = new Set(["REQUESTED", "SUBMITTED", "CONFIRMED"]);

function todayIsoUk(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatPaymentSummary(booking: CustomerSiteBookingRecord): string {
  const amount = booking.paymentAmountPence
    ? new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: booking.paymentCurrency || "GBP",
      }).format(booking.paymentAmountPence / 100)
    : null;
  const status = booking.paymentStatus?.replaceAll("_", " ").toLowerCase() ?? "not set";
  const method = booking.paymentMethod?.replaceAll("_", " ").toLowerCase() ?? "not set";
  return [amount, status, method].filter(Boolean).join(" | ");
}

function statusBadgeClass(status: string): string {
  if (status === "CONFIRMED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "COMPLETED") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "CANCELLED" || status === "NO_SHOW") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function staffFilterHref(siteSlug: string, staffId: string | null): string {
  return staffId
    ? `/site-staff/${encodeURIComponent(siteSlug)}?staffId=${encodeURIComponent(staffId)}`
    : `/site-staff/${encodeURIComponent(siteSlug)}`;
}

function bookingSortValue(booking: CustomerSiteBookingRecord): string {
  return `${booking.preferredDate ?? "9999-99-99"}T${booking.preferredTime ?? "99:99"}`;
}

function BookingCard({
  booking,
  siteSlug,
  canComplete,
  canViewContactDetails,
  canViewPaymentStatus,
}: {
  booking: CustomerSiteBookingRecord;
  siteSlug: string;
  canComplete: boolean;
  canViewContactDetails: boolean;
  canViewPaymentStatus: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {formatBookingDateTime(booking) || "Time not set"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {booking.serviceName ?? "Service not set"} {booking.staffName ? `| ${booking.staffName}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
          {booking.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
        <p><span className="font-semibold">Customer:</span> {booking.customerName}</p>
        <p><span className="font-semibold">Phone:</span> {canViewContactDetails ? booking.customerPhone || "Not set" : "Hidden by staff permissions"}</p>
        <p><span className="font-semibold">Email:</span> {canViewContactDetails ? booking.customerEmail || "Not set" : "Hidden by staff permissions"}</p>
        <p><span className="font-semibold">Payment:</span> {canViewPaymentStatus ? formatPaymentSummary(booking) : "Hidden by staff permissions"}</p>
      </div>
      {booking.notes ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <span className="font-semibold">Notes:</span> {booking.notes}
        </p>
      ) : null}
      {canComplete ? (
        <div className="mt-3">
          <MarkBookingCompletedButton siteSlug={siteSlug} bookingId={booking.id} />
        </div>
      ) : null}
    </article>
  );
}

function BookingSection({
  title,
  description,
  bookings,
  siteSlug,
  canComplete,
  permissions,
}: {
  title: string;
  description: string;
  bookings: CustomerSiteBookingRecord[];
  siteSlug: string;
  canComplete: boolean;
  permissions: CustomerSiteStaffPermissions;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
          {bookings.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            No appointments in this section.
          </p>
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              siteSlug={siteSlug}
              canComplete={canComplete && permissions.markCompleted && ACTIVE_STATUSES.has(booking.status)}
              canViewContactDetails={permissions.viewCustomerContactDetails}
              canViewPaymentStatus={permissions.viewPaymentStatus}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default async function SiteStaffPage({ params, searchParams }: SiteStaffPageProps) {
  const { siteSlug } = await params;
  const { staffId } = await searchParams;
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) notFound();

  const session = await getSiteStaffSessionContext();
  if (!session || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    redirect(
      `/site-staff/login?siteSlug=${encodeURIComponent(site.slug)}&callbackUrl=${encodeURIComponent(`/site-staff/${site.slug}`)}`,
    );
  }

  const currentStaff = await prisma.customerSiteStaffMember.findFirst({
    where: {
      id: session.staffMemberId,
      tenantSiteId: site.id,
      active: true,
      staffAccessEnabled: true,
    },
    select: { isSuperUser: true, staffPermissions: true },
  });
  if (!currentStaff) {
    redirect(
      `/site-staff/login?siteSlug=${encodeURIComponent(site.slug)}&callbackUrl=${encodeURIComponent(`/site-staff/${site.slug}`)}`,
    );
  }
  const permissions = normalizeStaffPermissions(currentStaff.staffPermissions, currentStaff.isSuperUser);

  const staffMembers = await prisma.customerSiteStaffMember.findMany({
    where: { tenantSiteId: site.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    select: { id: true, displayName: true, staffAccessEnabled: true, email: true },
  });
  const selectedStaffId = staffMembers.some((staff) => staff.id === staffId) ? staffId ?? "" : "";
  const bookings = (await listCustomerSiteBookings(site.id, { take: 200 }))
    .filter((booking) => !selectedStaffId || booking.staffMemberId === selectedStaffId)
    .sort((a, b) => bookingSortValue(a).localeCompare(bookingSortValue(b)));
  const today = todayIsoUk();
  const todayBookings = bookings.filter(
    (booking) => booking.preferredDate === today && ACTIVE_STATUSES.has(booking.status),
  );
  const upcomingBookings = bookings.filter(
    (booking) =>
      (booking.preferredDate ?? "") > today &&
      ACTIVE_STATUSES.has(booking.status),
  );
  const recentClosedBookings = bookings
    .filter((booking) => booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "NO_SHOW")
    .slice(-20)
    .reverse();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shared staff diary</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {site.displayName} staff appointments
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as {session.staffDisplayName}. This view shows the shared appointment diary for the business.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Permissions: {currentStaff.isSuperUser ? "Super-user staff" : "Standard staff"}.
            {permissions.addManualBooking ? " Manual booking permission is saved; the staff-side manual booking form is future work." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sites/${encodeURIComponent(site.slug)}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Public site
          </Link>
          <SiteStaffLogoutButton />
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Staff filter</h2>
            <p className="mt-1 text-sm text-slate-600">
              Default is all staff. Any active staff login can view the shared diary.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={staffFilterHref(site.slug, null)}
              className={`rounded-md border px-3 py-2 font-semibold ${
                !selectedStaffId
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
              }`}
            >
              All staff
            </Link>
            {staffMembers.map((staff) => (
              <Link
                key={staff.id}
                href={staffFilterHref(site.slug, staff.id)}
                className={`rounded-md border px-3 py-2 font-semibold ${
                  selectedStaffId === staff.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {staff.displayName}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6">
        <StaffVoucherLookup siteSlug={site.slug} canRedeem={permissions.redeemVouchers} />
        <BookingSection
          title="Today's appointments"
          description="Current active appointments for today."
          bookings={todayBookings}
          siteSlug={site.slug}
          canComplete={permissions.markCompleted}
          permissions={permissions}
        />
        <BookingSection
          title="Upcoming appointments"
          description="Future active appointments across the business."
          bookings={upcomingBookings}
          siteSlug={site.slug}
          canComplete={permissions.markCompleted}
          permissions={permissions}
        />
        <BookingSection
          title="Recently completed/cancelled"
          description="Recent closed appointments for quick reference."
          bookings={recentClosedBookings}
          siteSlug={site.slug}
          canComplete={false}
          permissions={permissions}
        />
      </div>
    </main>
  );
}
