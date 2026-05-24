import { redirect } from "next/navigation";
import { SiteAdminLogoutButton } from "@/components/site-admin/site-admin-logout-button";
import { SiteAdminDashboard } from "@/components/site-admin/site-admin-dashboard";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

type SiteAdminPageProps = {
  params: Promise<{ siteSlug: string }>;
};

export default async function SiteAdminPage({ params }: SiteAdminPageProps) {
  const { siteSlug } = await params;
  const session = await getSiteAdminSessionContext();
  if (!session) {
    redirect("/site-admin/login");
  }

  const site = await getTenantSiteBySlug(siteSlug);
  if (!site || session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    redirect(`/site-admin/${encodeURIComponent(session.tenantSlug)}`);
  }

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

      <div className="mt-6">
        <SiteAdminDashboard siteSlug={site.slug} />
      </div>
    </main>
  );
}

