"use client";

import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { BusinessSiteSettingsShell } from "@/components/admin/business-site-settings-shell";
import { outlineButtonClass } from "@/lib/ui/button-styles";

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Site Settings Demo</h1>
          <p className="mt-2 text-slate-600">
            Local-only preview of the settings a subscriber/business owner will manage for their own website.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            These are not platform-wide settings. Platform setup requests, subscriber sites, sales pipeline and provisioning are
            managed from the platform admin dashboard.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            This route remains at <span className="font-mono">/admin/settings</span> for now and is expected to move later under a
            subscriber/business-owner settings area.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className={outlineButtonClass}>
            Back to admin
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      <div className="mt-6">
        <BusinessSiteSettingsShell />
      </div>
    </main>
  );
}

