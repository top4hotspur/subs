import { SubscriptionSetupStatus } from "@/lib/sites/types";
import { prisma } from "@/lib/db/prisma";

export type PlatformDashboardSummary = {
  orderQueueCount: number;
  liveSubscriberSiteCount: number;
  paymentFailCount: number;
  orderStatusCounts: Array<{ status: string; count: number }>;
  subscriberStatusCounts: Array<{ status: string; count: number }>;
  contactEnquiryCounts: Array<{ status: string; count: number }>;
  salesLeadStatusCounts: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    businessName: string;
    industrySlug: string;
    status: string;
    createdAt: Date;
    setupTotalGbp: number;
    monthlyTotalGbp: number;
    paymentStatus: string | null;
  }>;
  recentSites: Array<{
    id: string;
    slug: string;
    displayName: string;
    industrySlug: string | null;
    status: string;
    provisioningStatus: string | null;
    subscriptionStatus: string | null;
    createdAt: Date;
  }>;
  recentContactEnquiries: Array<{
    id: string;
    name: string;
    businessName: string | null;
    email: string;
    status: string;
    createdAt: Date;
  }>;
  recentSalesLeads: Array<{
    id: string;
    businessName: string;
    industrySlug: string | null;
    status: string;
    createdAt: Date;
  }>;
  paymentFailureRows: Array<{
    siteId: string;
    siteName: string;
    industrySlug: string | null;
    subscriptionStatus: string;
    monthlyFeeGbp: number;
  }>;
  revenueByIndustry: Array<{
    industry: string;
    activeSubscriberSites: number;
    monthlyRevenueEstimateGbp: number;
    setupFeesKnownGbp: number;
    domainFeesKnownGbp: number;
    paymentFailuresKnown: number;
  }>;
};

const ORDER_QUEUE_STATUSES = new Set<string>([
  SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
  SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED,
  SubscriptionSetupStatus.PAYMENT_PENDING,
  SubscriptionSetupStatus.SITE_PROVISIONING,
  SubscriptionSetupStatus.CHANGE_REQUESTED,
]);

export async function getPlatformDashboardSummary(): Promise<PlatformDashboardSummary> {
  const [
    orderStatusRaw,
    recentOrders,
    subscriberStatusRaw,
    recentSites,
    contactStatusRaw,
    recentContactEnquiries,
    salesStatusRaw,
    recentSalesLeads,
    paymentFailuresRaw,
    activeSites,
    setupRequestsAll,
  ] = await Promise.all([
    prisma.setupRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.setupRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        businessName: true,
        industrySlug: true,
        status: true,
        createdAt: true,
        setupTotalGbp: true,
        monthlyTotalGbp: true,
        paymentStatus: true,
      },
    }),
    prisma.tenantSite.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.tenantSite.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        slug: true,
        displayName: true,
        industrySlug: true,
        status: true,
        provisioningStatus: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    }),
    prisma.contactEnquiry.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.contactEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        businessName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.salesLead.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.salesLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        businessName: true,
        industrySlug: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.subscriptionRecord.findMany({
      where: {
        status: { in: ["PAYMENT_FAILED"] },
      },
      select: {
        status: true,
        monthlyFeeGbp: true,
        tenantSite: {
          select: {
            id: true,
            displayName: true,
            industrySlug: true,
          },
        },
      },
    }),
    prisma.tenantSite.findMany({
      where: {
        OR: [{ status: "SITE_LIVE" }, { provisioningStatus: "SITE_LIVE" }, { subscriptionStatus: "ACTIVE" }],
      },
      select: {
        id: true,
        industrySlug: true,
        subscriptions: {
          select: {
            monthlyFeeGbp: true,
            setupFeeGbp: true,
            domainFeeGbp: true,
            status: true,
          },
        },
      },
    }),
    prisma.setupRequest.findMany({
      select: {
        industrySlug: true,
        setupTotalGbp: true,
        domainOption: true,
        paymentStatus: true,
      },
    }),
  ]);

  const orderStatusCounts = orderStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));
  const subscriberStatusCounts = subscriberStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));
  const contactEnquiryCounts = contactStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));
  const salesLeadStatusCounts = salesStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));

  const orderQueueCount = orderStatusCounts
    .filter((item) => ORDER_QUEUE_STATUSES.has(item.status))
    .reduce((sum, item) => sum + item.count, 0);

  const liveSubscriberSiteCount = activeSites.length;

  const paymentFailCount = paymentFailuresRaw.length;
  const paymentFailureRows = paymentFailuresRaw.map((row) => ({
    siteId: row.tenantSite.id,
    siteName: row.tenantSite.displayName,
    industrySlug: row.tenantSite.industrySlug,
    subscriptionStatus: row.status,
    monthlyFeeGbp: row.monthlyFeeGbp,
  }));

  const revenueByIndustryMap = new Map<
    string,
    {
      activeSubscriberSites: number;
      monthlyRevenueEstimateGbp: number;
      setupFeesKnownGbp: number;
      domainFeesKnownGbp: number;
      paymentFailuresKnown: number;
    }
  >();

  for (const site of activeSites) {
    const industry = site.industrySlug ?? "unassigned";
    const current =
      revenueByIndustryMap.get(industry) ??
      {
        activeSubscriberSites: 0,
        monthlyRevenueEstimateGbp: 0,
        setupFeesKnownGbp: 0,
        domainFeesKnownGbp: 0,
        paymentFailuresKnown: 0,
      };
    current.activeSubscriberSites += 1;
    for (const sub of site.subscriptions) {
      current.monthlyRevenueEstimateGbp += sub.monthlyFeeGbp;
      current.setupFeesKnownGbp += sub.setupFeeGbp;
      current.domainFeesKnownGbp += sub.domainFeeGbp;
      if (sub.status === "PAYMENT_FAILED") {
        current.paymentFailuresKnown += 1;
      }
    }
    revenueByIndustryMap.set(industry, current);
  }

  for (const request of setupRequestsAll) {
    if (request.paymentStatus !== "PAID") continue;
    const industry = request.industrySlug || "unassigned";
    const current =
      revenueByIndustryMap.get(industry) ??
      {
        activeSubscriberSites: 0,
        monthlyRevenueEstimateGbp: 0,
        setupFeesKnownGbp: 0,
        domainFeesKnownGbp: 0,
        paymentFailuresKnown: 0,
      };
    current.setupFeesKnownGbp += 149;
    if (request.domainOption === "WE_REGISTER_DOMAIN") {
      current.domainFeesKnownGbp += 49;
    }
    revenueByIndustryMap.set(industry, current);
  }

  const revenueByIndustry = Array.from(revenueByIndustryMap.entries())
    .map(([industry, values]) => ({ industry, ...values }))
    .sort((a, b) => b.monthlyRevenueEstimateGbp - a.monthlyRevenueEstimateGbp);

  return {
    orderQueueCount,
    liveSubscriberSiteCount,
    paymentFailCount,
    orderStatusCounts,
    subscriberStatusCounts,
    contactEnquiryCounts,
    salesLeadStatusCounts,
    recentOrders,
    recentSites,
    recentContactEnquiries,
    recentSalesLeads,
    paymentFailureRows,
    revenueByIndustry,
  };
}
