import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteAdminLogoutButton } from "@/components/site-admin/site-admin-logout-button";
import { SiteAdminDashboard } from "@/components/site-admin/site-admin-dashboard";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";
import { prisma } from "@/lib/db/prisma";
import { hasValidOpenBusinessDay, normalizeBusinessOpeningHours, timeToMinutes } from "@/lib/sites/customer-site-opening-hours";

type SiteAdminPageProps = {
  params: Promise<{ siteSlug: string }>;
};

type ProgressStatus = "Done" | "Ready" | "Needs setup";

function getStatusBadgeClass(status: ProgressStatus): string {
  if (status === "Done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "Needs setup") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export default async function SiteAdminPage({ params }: SiteAdminPageProps) {
  const { siteSlug } = await params;
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) {
    notFound();
  }

  const session = await getSiteAdminSessionContext();
  if (!session) {
    redirect(`/site-admin/login?siteSlug=${encodeURIComponent(site.slug)}`);
  }

  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-amber-900">Access restricted</h1>
          <p className="mt-2 text-sm text-amber-900">
            This subscriber admin area is tenant-scoped. Please sign in with the correct site admin account.
          </p>
          <div className="mt-4">
            <Link
              href={`/site-admin/login?siteSlug=${encodeURIComponent(site.slug)}`}
              className="inline-flex rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Go to site admin login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const [settings, servicesCount, activeStaff, rotaDays, closureCount, staffLeaveCount] = await Promise.all([
    prisma.customerSiteSettings.findUnique({ where: { tenantSiteId: site.id } }),
    prisma.customerSiteService.count({ where: { tenantSiteId: site.id, active: true } }),
    prisma.customerSiteStaffMember.findMany({
      where: { tenantSiteId: site.id, active: true },
      select: { id: true },
    }),
    prisma.customerSiteStaffRotaDay.findMany({
      where: { tenantSiteId: site.id },
      select: { staffMemberId: true, working: true, startTime: true, endTime: true },
    }),
    prisma.customerSiteBusinessClosure.count({ where: { tenantSiteId: site.id, active: true } }),
    prisma.customerSiteStaffHoliday.count({ where: { tenantSiteId: site.id, active: true } }),
  ]);
  const businessOpeningHours = normalizeBusinessOpeningHours(settings?.openingHoursJson ?? null);
  const openingHoursDone = hasValidOpenBusinessDay(businessOpeningHours);
  const activeStaffIds = new Set(activeStaff.map((staff) => staff.id));
  const staffCount = activeStaff.length;
  const validRotaCount = rotaDays.filter((day) => {
    if (!day.working || !activeStaffIds.has(day.staffMemberId)) return false;
    const start = timeToMinutes(day.startTime ?? "");
    const end = timeToMinutes(day.endTime ?? "");
    return start !== null && end !== null && end > start;
  }).length;
  const staffRotaReady = staffCount > 0 && validRotaCount > 0;

  const checklist = [
    {
      title: "Confirm business details",
      status: settings?.businessName && settings?.phone && settings?.email ? "Done" : "Needs setup",
    },
    {
      title: "Add at least one service",
      status: servicesCount > 0 ? "Done" : "Needs setup",
    },
    {
      title: "Add staff and set staff rota",
      status: staffRotaReady ? "Done" : "Needs setup",
    },
    {
      title: "Set opening hours",
      status: openingHoursDone ? "Done" : "Needs setup",
    },
    {
      title: "Set booking/cancellation policy",
      status:
        settings?.cancellationPolicyNote?.trim() ||
        settings?.cancellationFullRefundNoticeDays !== null ||
        settings?.cancellationNoRefundWithinDays !== null
          ? "Done"
          : "Needs setup",
    },
    {
      title: "Preview public site",
      status: "Ready",
    },
    {
      title: "Ready to go live",
      status:
        servicesCount > 0 &&
        settings?.businessName &&
        settings?.phone &&
        settings?.email &&
        openingHoursDone &&
        staffRotaReady
          ? "Done"
          : "Needs setup",
    },
  ];

  const setupSections = [
    {
      title: "Business details",
      summary: settings?.businessName ? "Business identity started" : "Add contact basics below",
    },
    {
      title: "Services/prices",
      summary: servicesCount > 0 ? `${servicesCount} active service(s)` : "Add your first public service below",
    },
    {
      title: "Staff setup",
      summary: staffCount > 0 ? `${staffCount} active staff member(s)` : "Add staff or decide staff choice is not needed",
    },
    {
      title: "Opening hours / rota",
      summary: openingHoursDone
        ? staffRotaReady
          ? "Business hours and staff rota configured"
          : "Business hours set; add staff rota next"
        : "Set business hours first; staff rota comes next",
    },
    {
      title: "Breaks and closures",
      summary:
        closureCount + staffLeaveCount > 0
          ? `${closureCount} active closure(s), ${staffLeaveCount} staff leave record(s)`
          : "Optional override dates for closures and staff leave",
    },
    { title: "Booking settings", summary: "Configure booking preferences below" },
    { title: "Gift vouchers", summary: "Future voucher setup area" },
    { title: "Policies", summary: "Edit cancellation and customer policy wording below" },
    { title: "Page content / visibility", summary: "Edit public page content below" },
    { title: "Payments/sales", summary: "Record payment preferences below" },
    { title: "Customer CRM", summary: "Future tenant CRM tooling" },
    { title: "Preview public site", summary: "Open the tenant preview route in a new tab" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Admin</h1>
          <p className="mt-2 text-sm text-slate-600">
            Subscriber site owner area for <span className="font-semibold">{site.displayName}</span>.
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Platform admin features are separate and not available in this area.
          </p>
        </div>
        <SiteAdminLogoutButton />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Get your site ready</h2>
          <Link
            href={`/sites/${encodeURIComponent(site.slug)}`}
            className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview public site
          </Link>
        </div>
        <div className="mt-4 grid gap-2">
          {checklist.map((item) => (
            <div key={item.title} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status as ProgressStatus)}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Setup section guide</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use this as a quick map of the setup areas below. The checklist above is the main progress tracker.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {setupSections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800">
                  Open
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{section.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <SiteAdminDashboard siteSlug={site.slug} />
      </div>
    </main>
  );
}
