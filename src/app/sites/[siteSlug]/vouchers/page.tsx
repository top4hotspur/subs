import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicGiftVoucherForm } from "@/components/sites/public-gift-voucher-form";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { normalizeGiftVoucherSettings, vouchersArePublic } from "@/lib/sites/customer-site-voucher-types";

export default async function SiteGiftVouchersPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();
  const settings = normalizeGiftVoucherSettings(preview.settings?.giftVoucherSettingsJson);
  if (!vouchersArePublic(settings)) notFound();
  const siteName = preview.settings?.siteDisplayName || preview.settings?.businessName || preview.tenantSite.displayName;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}`} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Back to {siteName}
        </Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Gift vouchers</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Buy a {siteName} gift voucher</h1>
          <p className="mt-3 text-sm text-slate-600">
            Choose a voucher value and delivery option. Payment is not taken online in this first version; the business will confirm payment and activate the voucher before it can be redeemed.
          </p>
        </section>
        <div className="mt-6">
          <PublicGiftVoucherForm siteSlug={preview.tenantSite.slug} siteName={siteName} settings={settings} />
        </div>
      </div>
    </main>
  );
}
