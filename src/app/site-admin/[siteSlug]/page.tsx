import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteAdminLogoutButton } from "@/components/site-admin/site-admin-logout-button";
import { SiteAdminDashboard } from "@/components/site-admin/site-admin-dashboard";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";
import { prisma } from "@/lib/db/prisma";

type SiteAdminPageProps = {
  params: Promise<{ siteSlug: string }>;
};

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

  const [settings, servicesCount, staffCount, rotaCount, closureCount] = await Promise.all([
    prisma.customerSiteSettings.findUnique({ where: { tenantSiteId: site.id } }),
    prisma.customerSiteService.count({ where: { tenantSiteId: site.id, active: true } }),
    prisma.customerSiteStaffMember.count({ where: { tenantSiteId: site.id, active: true } }),
    prisma.customerSiteStaffRotaDay.count({ where: { tenantSiteId: site.id } }),
    prisma.customerSiteBusinessClosure.count({ where: { tenantSiteId: site.id, active: true } }),
  ]);

  const checklist = [
    {
      title: "Confirm business details",
      status: settings?.businessName && settings?.phone && settings?.email ? "Done" : "Not set yet",
    },
    {
      title: "Add at least one service",
      status: servicesCount > 0 ? "Done" : "Not set yet",
    },
    {
      title: "Add staff or mark staff selection as not required",
      status: staffCount > 0 ? "Done" : "Not set yet",
    },
    {
      title: "Set opening hours",
      status: settings?.openingHoursSummary?.trim() ? "Done" : "Not set yet",
    },
    {
      title: "Set booking/cancellation policy",
      status:
        settings?.cancellationPolicyNote?.trim() ||
        settings?.cancellationFullRefundNoticeDays !== null ||
        settings?.cancellationNoRefundWithinDays !== null
          ? "Done"
          : "Not set yet",
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
        settings?.openingHoursSummary?.trim()
          ? "In progress"
          : "Not set yet",
    },
  ];

  const setupSections = [
    { title: "Business details", summary: settings?.businessName ? "Configured" : "Not set yet" },
    { title: "Services/prices", summary: servicesCount > 0 ? `${servicesCount} active service(s)` : "Not set yet" },
    { title: "Staff setup", summary: staffCount > 0 ? `${staffCount} active staff member(s)` : "Not set yet" },
    { title: "Opening hours / rota", summary: rotaCount > 0 ? `${rotaCount} rota row(s)` : "Not set yet" },
    { title: "Breaks and closures", summary: closureCount > 0 ? `${closureCount} active closure(s)` : "Not set yet" },
    { title: "Booking settings", summary: "Available in detailed settings below" },
    { title: "Gift vouchers", summary: "Placeholder for voucher setup" },
    { title: "Policies", summary: "Available in detailed settings below" },
    { title: "Page content / visibility", summary: "Available in detailed settings below" },
    { title: "Payments/sales", summary: "Available in detailed settings below" },
    { title: "Customer CRM", summary: "Placeholder for future tenant CRM tooling" },
    { title: "Preview public site", summary: "Open live tenant preview route" },
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
          >
            Preview public site
          </Link>
        </div>
        <div className="mt-4 grid gap-2">
          {checklist.map((item) => (
            <div key={item.title} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className={item.status === "Done" ? "font-semibold text-emerald-700" : "font-semibold text-slate-600"}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Subscriber setup dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          Complete these sections to finish onboarding your clean subscriber site.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {setupSections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
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
