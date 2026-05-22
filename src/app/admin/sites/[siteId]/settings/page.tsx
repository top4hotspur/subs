"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { BusinessSiteSettingsShell } from "@/components/admin/business-site-settings-shell";
import { getAdminTenantSiteDetail } from "@/lib/sites/admin-sites-client";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatOptional } from "@/lib/ui/display-labels";

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Please sign in with a platform admin account.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while loading subscriber site detail.";
  }
  return `Could not load site detail: ${error}`;
}

export default function AdminSiteSettingsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = typeof params?.siteId === "string" ? params.siteId : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [industrySlug, setIndustrySlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      if (!siteId) {
        setError("Missing site id.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const result = await getAdminTenantSiteDetail(siteId);
      if (!active) return;
      if (!result.ok) {
        setError(toMessage(result.error, result.status));
        setLoading(false);
        return;
      }
      setSiteName(result.site.displayName);
      setIndustrySlug(result.site.industrySlug ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [siteId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Business Site Settings for {siteName ?? "Subscriber site"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This is the settings area a subscriber/business owner will eventually use for their own website.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Settings are still local/mock in this version unless otherwise stated.
          </p>
          {industrySlug ? (
            <p className="mt-1 text-sm text-slate-600">
              Linked subscriber industry: <span className="font-semibold">{formatOptional(industrySlug)}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/sites?siteId=${encodeURIComponent(siteId)}`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to subscriber site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      {loading ? <p className="mt-6 text-sm text-slate-600">Loading site detail...</p> : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          <div className="mt-3">
            <Link href="/admin/sites" className={`${outlineButtonClass} ${smallButtonClass}`}>
              Back to subscriber sites
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6">
          <BusinessSiteSettingsShell />
        </div>
      ) : null}
    </main>
  );
}

