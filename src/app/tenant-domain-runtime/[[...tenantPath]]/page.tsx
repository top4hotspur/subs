import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicSiteSlugPage from "@/app/sites/[siteSlug]/page";
import PublicSiteAboutPage from "@/app/sites/[siteSlug]/about/page";
import CustomerAccountPage from "@/app/sites/[siteSlug]/account/page";
import CustomerAccountLoginPage from "@/app/sites/[siteSlug]/account/login/page";
import CustomerAccountRegisterPage from "@/app/sites/[siteSlug]/account/register/page";
import PublicSiteSlugBookingPage from "@/app/sites/[siteSlug]/booking/page";
import BookingPaymentReturnPage from "@/app/sites/[siteSlug]/booking/payment/page";
import CustomerBookingPage from "@/app/sites/[siteSlug]/booking/[token]/page";
import PublicSiteContactPage from "@/app/sites/[siteSlug]/contact/page";
import PublicSiteCookiePolicyPage from "@/app/sites/[siteSlug]/cookies/page";
import PublicSitePolicyPage from "@/app/sites/[siteSlug]/policy/page";
import PublicSitePrivacyPage from "@/app/sites/[siteSlug]/privacy/page";
import SiteGiftVouchersPage from "@/app/sites/[siteSlug]/vouchers/page";
import {
  getTenantDomainBlockReason,
  getLiveTenantSiteByDomainHost,
  isTenantDomainRenderable,
  isTenantUnavailableStatus,
  resolveTenantSiteByHost,
} from "@/lib/sites/tenant-resolver";

type TenantDomainPageProps = {
  params: Promise<{ tenantPath?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function unavailablePage(reason = "SITE_NOT_LIVE") {
  const suspended = reason === "SUSPENDED_OR_CANCELLED";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          {suspended ? "Website unavailable" : "Website not live yet"}
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          {suspended ? "This website is currently unavailable." : "This website is being prepared."}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {suspended
            ? "Please contact the business or MyExperiment.club support."
            : "The domain is connected to MyExperiment.club, but this site is not marked live yet."}
        </p>
      </section>
    </main>
  );
}

export default async function TenantDomainPage({ params, searchParams }: TenantDomainPageProps) {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "";
  const liveMatch = await getLiveTenantSiteByDomainHost(host);
  if (!liveMatch) {
    const broadMatch = await resolveTenantSiteByHost(host, { includeUnavailable: true });
    if (broadMatch) {
      const blockReason = getTenantDomainBlockReason(broadMatch);
      if (
        blockReason ||
        !isTenantDomainRenderable(broadMatch) ||
        isTenantUnavailableStatus(broadMatch.siteStatus) ||
        isTenantUnavailableStatus(broadMatch.provisioningStatus) ||
        isTenantUnavailableStatus(broadMatch.domainStatus)
      ) {
        return unavailablePage(blockReason ?? "SITE_NOT_LIVE");
      }
    }
    notFound();
  }

  const { tenantPath = [] } = await params;
  const siteParams = Promise.resolve({ siteSlug: liveMatch.tenantSlug });
  const path = tenantPath.map((segment) => segment.toLowerCase());

  if (path.length === 0) return <PublicSiteSlugPage params={siteParams} />;
  if (path.length === 2 && path[0] === "sites" && path[1] === liveMatch.tenantSlug.toLowerCase()) {
    redirect("/");
  }
  if (path.length === 1 && path[0] === "about") return <PublicSiteAboutPage params={siteParams} />;
  if (path.length === 1 && (path[0] === "account" || path[0] === "my-account")) {
    return <CustomerAccountPage params={siteParams} />;
  }
  if (path.length === 2 && path[0] === "account" && path[1] === "login") {
    return <CustomerAccountLoginPage params={siteParams} />;
  }
  if (path.length === 2 && path[0] === "account" && path[1] === "register") {
    return <CustomerAccountRegisterPage params={siteParams} />;
  }
  if (path.length === 1 && path[0] === "booking") return <PublicSiteSlugBookingPage params={siteParams} />;
  if (path.length === 2 && path[0] === "booking" && path[1] === "payment") {
    return (
      <BookingPaymentReturnPage
        params={siteParams}
        searchParams={searchParams as Promise<{ bookingId?: string; checkout?: string }>}
      />
    );
  }
  if (path.length === 2 && path[0] === "booking") {
    return (
      <CustomerBookingPage
        params={Promise.resolve({ siteSlug: liveMatch.tenantSlug, token: tenantPath[1] ?? "" })}
        searchParams={searchParams as Promise<{ cancelled?: string; error?: string }>}
      />
    );
  }
  if (path.length === 1 && path[0] === "contact") {
    return (
      <PublicSiteContactPage
        params={siteParams}
        searchParams={searchParams as Promise<{
          purpose?: string;
          name?: string;
          email?: string;
          phone?: string;
          bookingId?: string;
        }>}
      />
    );
  }
  if (path.length === 1 && path[0] === "cookies") return <PublicSiteCookiePolicyPage params={siteParams} />;
  if (path.length === 1 && path[0] === "policy") return <PublicSitePolicyPage params={siteParams} />;
  if (path.length === 1 && path[0] === "privacy") return <PublicSitePrivacyPage params={siteParams} />;
  if (path.length === 1 && path[0] === "vouchers") return <SiteGiftVouchersPage params={siteParams} />;

  notFound();
}
