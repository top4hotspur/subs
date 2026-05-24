import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { PersistedSiteBookingForm } from "@/components/admin/persisted-site-booking-form";
import { listCustomerSiteBookings } from "@/lib/sites/customer-site-booking-repository";
import { getCustomerSitePreviewData } from "@/lib/sites/customer-site-preview-repository";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

export default async function AdminSitePersistedBookingPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const preview = await getCustomerSitePreviewData(siteId);
  if (!preview) notFound();

  const initialBookings = await listCustomerSiteBookings(siteId, { take: 20 });
  const services = preview.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    basePrice: service.basePrice,
    durationMinutes: service.durationMinutes,
    active: service.active,
  }));
  const staff = preview.staffMembers.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    roleLabel: member.roleLabel,
    customerSelectable: member.customerSelectable,
    active: member.active,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Persisted preview booking</h1>
          <p className="mt-2 text-sm text-slate-600">
            Platform-admin protected booking preview for TenantSite persisted records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/sites/${encodeURIComponent(siteId)}/preview`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to preview
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p>
          This route creates persisted booking/request records for the selected TenantSite.
          Public booking routing, real payments, and messaging are out of scope for this pass.
        </p>
      </section>

      <div className="mt-6">
        <PersistedSiteBookingForm
          siteId={siteId}
          services={services}
          staff={staff}
          initialBookings={initialBookings}
        />
      </div>
    </main>
  );
}

