import { notFound } from "next/navigation";
import { PublicSiteBookingForm } from "@/components/sites/public-site-booking-form";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getPublicSiteBasePath } from "@/lib/sites/public-site-url";

export default async function PublicSiteSlugBookingPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();
  const publicBasePath = await getPublicSiteBasePath(preview.tenantSite.slug);

  const services = preview.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PublicSiteBookingForm
          siteSlug={preview.tenantSite.slug}
          publicBasePath={publicBasePath}
          services={services}
          staff={staff}
          acceptCashPayments={preview.settings?.acceptCashPayments ?? false}
          acceptCardPayments={preview.settings?.acceptCardPayments ?? true}
          requireBookingPrepayment={preview.settings?.requireBookingPrepayment ?? false}
          allowInStorePaymentRecording={preview.settings?.allowInStorePaymentRecording ?? false}
        />
      </div>
    </main>
  );
}
