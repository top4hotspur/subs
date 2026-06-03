import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { verifyCustomerMarketingUnsubscribeToken } from "@/lib/sites/customer-marketing-unsubscribe-token";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type PageProps = {
  params: Promise<{ siteSlug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function CustomerMarketingUnsubscribePage({ params, searchParams }: PageProps) {
  const { siteSlug } = await params;
  const { token } = await searchParams;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  const publicBasePath = preview ? await getPublicSiteBasePath(preview.tenantSite.slug) : `/sites/${encodeURIComponent(siteSlug)}`;
  const siteName = preview?.settings?.siteDisplayName || preview?.settings?.businessName || preview?.tenantSite.displayName || "this business";

  let title = "We could not update your preference";
  let message = "This unsubscribe link is invalid or has expired. Please contact the business if you need help updating your marketing preference.";

  const verified = token ? verifyCustomerMarketingUnsubscribeToken(token) : null;
  if (preview && verified && verified.siteSlug === preview.tenantSite.slug && verified.tenantSiteId === preview.tenantSite.id) {
    const customer = await prisma.customerSiteCustomer.findFirst({
      where: {
        id: verified.customerId,
        tenantSiteId: verified.tenantSiteId,
        email: verified.email,
      },
      select: { id: true, active: true },
    });
    if (customer) {
      await prisma.customerSiteCustomer.update({
        where: { id: customer.id },
        data: {
          marketingOptIn: false,
          marketingOptInAt: null,
        },
      });
      title = "You have been unsubscribed";
      message = `You have been unsubscribed from marketing messages from ${siteName}. This does not affect transactional booking emails.`;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{siteName}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
        <Link
          href={buildPublicSitePath(publicBasePath)}
          className="mt-6 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Back to website
        </Link>
      </section>
    </main>
  );
}
