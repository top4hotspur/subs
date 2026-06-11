import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteAdminLogoutButton } from "@/components/site-admin/site-admin-logout-button";
import { SiteAdminDashboard } from "@/components/site-admin/site-admin-dashboard";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";
import { prisma } from "@/lib/db/prisma";
import { hasValidOpenBusinessDay, normalizeBusinessOpeningHours, timeToMinutes } from "@/lib/sites/customer-site-opening-hours";
import { isCustomPolicyContent } from "@/lib/sites/default-booking-policy";
import {
  dnsWorkflowStatusLabel,
  domainSetupModeLabel,
  lifecycleStatusLabel,
  setupRequestDomainOptionToMode,
} from "@/lib/sites/site-lifecycle";

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

  const [settings, servicesCount, activeStaff, rotaDays, closureCount, staffLeaveCount, siteDomains, setupRequest] = await Promise.all([
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
    prisma.siteDomain.findMany({ where: { tenantSiteId: site.id }, orderBy: [{ domainType: "asc" }, { createdAt: "asc" }] }),
    prisma.setupRequest.findFirst({
      where: { tenantSiteId: site.id },
      select: { domainOption: true, existingDomain: true, desiredDomain: true },
    }),
  ]);
  const primaryDomain = siteDomains.find((domain) => domain.domainType === "PRIMARY") ?? siteDomains[0] ?? null;
  const domainSetupMode = primaryDomain?.domainSetupMode ?? setupRequestDomainOptionToMode(setupRequest?.domainOption);
  const requestedDomain = primaryDomain?.domain ?? siteDomains[0]?.domain ?? setupRequest?.existingDomain ?? setupRequest?.desiredDomain ?? null;
  const domainActionText =
    domainSetupMode === "NEW_DOMAIN_MANAGED"
      ? "We are checking your domain availability and setup."
      : domainSetupMode === "UNSURE"
        ? "We will contact you to confirm the best domain option."
        : primaryDomain?.dnsStatus === "INSTRUCTIONS_SENT" || primaryDomain?.status === "DNS_INSTRUCTIONS_SENT" || primaryDomain?.status === "WAITING_FOR_CUSTOMER_DNS"
          ? "Please update your DNS/nameservers using the instructions we sent you."
          : "We will send DNS/nameserver instructions when the domain setup step is ready.";
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
  const policyReady = Boolean(
    settings &&
      (settings.policyDefaultAccepted ||
        isCustomPolicyContent({
          policyTitle: settings.policyTitle,
          policyIntro: settings.policyIntro,
          policyBody: settings.policyBody,
          cancellationPolicyNote: settings.cancellationPolicyNote,
        })),
  );
  const paymentReady = Boolean(
    settings?.paymentProcessorSetupMode === "MANUAL_RECORDING_ONLY" ||
      settings?.paymentProcessorSetupMode === "NEED_HELP_SETUP" ||
      (settings?.paymentProcessorSetupMode === "EXISTING_PROCESSOR" && settings?.paymentProcessorName),
  );
  const logoReady = Boolean(settings?.logoUrl);
  const domainConnected = Boolean(
    site.provisioningStatus === "LIVE" ||
      site.domainStatus === "LIVE" ||
      primaryDomain?.status === "LIVE" ||
      primaryDomain?.dnsStatus === "DNS_CONFIGURED" ||
      primaryDomain?.dnsStatus === "VERIFIED",
  );

  const checklist = [
    {
      title: "Optional: add logo",
      status: logoReady ? "Done" : "Ready",
    },
    {
      title: "Confirm business details",
      status: settings?.businessName && settings?.phone && settings?.email ? "Done" : "Needs setup",
    },
    {
      title: "Add at least one service",
      status: servicesCount > 0 ? "Done" : "Needs setup",
    },
    {
      title: "Add staff",
      status: staffCount > 0 ? "Done" : "Needs setup",
    },
    {
      title: "Set staff rota",
      status: staffRotaReady ? "Done" : staffCount > 0 ? "Ready" : "Needs setup",
    },
    {
      title: "Set opening hours",
      status: openingHoursDone ? "Done" : "Needs setup",
    },
    {
      title: "Set booking/cancellation policy",
      status: policyReady ? "Done" : "Needs setup",
    },
    {
      title: "Set up payment processor",
      status: paymentReady ? "Done" : "Needs setup",
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
        staffRotaReady &&
        policyReady &&
        paymentReady
          ? "Done"
          : "Needs setup",
    },
  ];

  const setupSections = [
    {
      group: "Business setup",
      title: "Business settings",
      summary: settings?.businessName ? "Business identity started" : "Add contact basics below",
    },
    {
      group: "Business setup",
      title: "Site appearance",
      summary: logoReady ? "Logo or appearance started" : "Add logo, homepage image and appearance settings",
    },
    {
      group: "Business setup",
      title: "Policies / page content / visibility",
      summary: policyReady ? "Policy/page content started" : "Review policies and public page content",
    },
    {
      group: "Services & bookings",
      title: "Services and prices",
      summary: servicesCount > 0 ? `${servicesCount} active service(s)` : "Add your first public service below",
    },
    {
      group: "Services & bookings",
      title: "Booking settings",
      summary: "Configure booking preferences below",
    },
    {
      group: "Services & bookings",
      title: "Payment settings",
      summary: paymentReady ? "Payment setup choice selected" : "Choose online processor, assisted setup or manual payments",
    },
    {
      group: "Services & bookings",
      title: "Gift vouchers",
      summary: "Configure vouchers if you want to sell or redeem them",
    },
    {
      group: "Team & availability",
      title: "Staff setup",
      summary: staffCount > 0 ? `${staffCount} active staff member(s)` : "Add staff or decide staff choice is not needed",
    },
    {
      group: "Team & availability",
      title: "Opening hours / rota",
      summary: openingHoursDone
        ? staffRotaReady
          ? "Business hours and staff rota configured"
          : "Business hours set; add staff rota next"
        : "Set business hours first; staff rota comes next",
    },
    {
      group: "Team & availability",
      title: "Breaks / closures / holidays",
      summary:
        closureCount + staffLeaveCount > 0
          ? `${closureCount} active closure(s), ${staffLeaveCount} staff leave record(s)`
          : "Optional override dates for closures and staff leave",
    },
    { group: "Customers", title: "Customer CRM", summary: "Customer history, consent and enquiries" },
    { group: "Customers", title: "Preview public site", summary: "Open the tenant preview route in a new tab" },
  ];
  const setupGroups = Array.from(new Set(setupSections.map((section) => section.group))).map((group) => ({
    group,
    sections: setupSections.filter((section) => section.group === group),
  }));

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

      <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
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
            <div key={item.title} className="flex items-center justify-between gap-3 rounded-md border border-sky-100 bg-white px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status as ProgressStatus)}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Setup blocks can be hidden from the public site when setup is complete by turning off public setup guidance in Business settings.
        </p>
      </section>

      <section className={`mt-6 rounded-2xl border p-5 shadow-sm ${domainConnected ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50"}`}>
        <h2 className="text-xl font-semibold text-slate-900">{domainConnected ? "Domain connected" : "Domain setup"}</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold">Current preview URL:</span> /sites/{site.slug}</p>
          <p><span className="font-semibold">Requested domain:</span> {requestedDomain ?? "Not set yet"}</p>
          <p><span className="font-semibold">Domain route:</span> {domainSetupModeLabel(domainSetupMode)}</p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {primaryDomain?.dnsStatus
              ? dnsWorkflowStatusLabel(primaryDomain.dnsStatus)
              : lifecycleStatusLabel(primaryDomain?.status ?? site.domainStatus)}
          </p>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          {domainConnected
            ? "Your customer domain is connected. We keep the preview route available for support, but no further domain setup is needed here."
            : domainActionText}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Setup section guide</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use this as a quick map of the setup areas below. The checklist above is the main progress tracker.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {setupGroups.map((group) => (
            <article key={group.group} className="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <h3 className="text-sm font-semibold text-slate-950">{group.group}</h3>
              <div className="mt-3 space-y-2">
                {group.sections.map((section) => (
                  <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-3">
                    <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                    <p className="mt-1 text-xs text-slate-600">{section.summary}</p>
                  </div>
                ))}
              </div>
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
