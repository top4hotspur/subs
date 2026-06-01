import { prisma } from "@/lib/db/prisma";

type ProvisioningResult = {
  setupRequestId: string;
  tenantSiteId: string;
  siteSlug: string;
  publicSiteUrl: string;
  adminSiteUrl: string;
  created: boolean;
};

const PAID_STATUSES = new Set(["PAID", "SUBSCRIPTION_ACTIVE"]);
const CANCELLED_STATUSES = new Set(["CANCELLED"]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 56);
}

async function buildUniqueSlug(base: string): Promise<string> {
  const slugBase = slugify(base) || "site";
  let candidate = slugBase;
  let suffix = 1;

  // Slugs are stable after first creation. Collision strategy is deterministic.
  while (true) {
    const existing = await prisma.tenantSite.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${slugBase}-${suffix}`;
  }
}

function extractRequestedDomain(input?: string | null): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  const firstCandidate = raw
    .split(/[\s,\n\r\t]+/)
    .map((part) => part.trim())
    .find(Boolean);
  if (!firstCandidate) return null;

  const withoutProtocol = firstCandidate.replace(/^https?:\/\//i, "");
  const hostPart = withoutProtocol.split("/")[0]?.trim().toLowerCase() ?? "";
  if (!hostPart) return null;
  return hostPart;
}

function toUrls(siteSlug: string) {
  return {
    publicSiteUrl: `/sites/${siteSlug}`,
    adminSiteUrl: `/site-admin/${siteSlug}`,
  };
}

export async function createSubscriberSiteFromPaidSetupRequest(
  setupRequestId: string,
): Promise<ProvisioningResult> {
  return prisma.$transaction(async (tx) => {
    const setupRequest = await tx.setupRequest.findUnique({
      where: { id: setupRequestId },
      include: {
        tenantSite: true,
      },
    });

    if (!setupRequest) {
      throw new Error("SETUP_REQUEST_NOT_FOUND");
    }
    if (setupRequest.archivedAt) {
      throw new Error("SETUP_REQUEST_ARCHIVED");
    }
    if (CANCELLED_STATUSES.has(setupRequest.status)) {
      throw new Error("SETUP_REQUEST_CANCELLED");
    }
    if (!setupRequest.paymentStatus || !PAID_STATUSES.has(setupRequest.paymentStatus)) {
      throw new Error("SETUP_REQUEST_NOT_PAID");
    }

    const existing =
      setupRequest.tenantSite ??
      (await tx.tenantSite.findUnique({
        where: { setupRequestId: setupRequest.id },
      }));

    if (existing) {
      if (!setupRequest.tenantSiteId) {
        await tx.setupRequest.update({
          where: { id: setupRequest.id },
          data: { tenantSiteId: existing.id },
        });
      }
      return {
        setupRequestId: setupRequest.id,
        tenantSiteId: existing.id,
        siteSlug: existing.slug,
        ...toUrls(existing.slug),
        created: false,
      };
    }

    const slug = await buildUniqueSlug(setupRequest.businessName);
    const domainPrimary =
      extractRequestedDomain(setupRequest.existingDomain) ??
      extractRequestedDomain(setupRequest.desiredDomain);
    const domainStatus = domainPrimary ? "DETAILS_NEEDED" : "NOT_STARTED";

    const tenantSite = await tx.tenantSite.create({
      data: {
        slug,
        displayName: setupRequest.businessName,
        industrySlug: setupRequest.industrySlug,
        status: "SITE_PROVISIONING",
        provisioningStatus: "SITE_PROVISIONING",
        subscriptionStatus: "ACTIVE",
        domainStatus,
        domainPrimary,
        setupRequestId: setupRequest.id,
        whatsappAddonEnabled: false,
      },
    });

    await tx.setupRequest.update({
      where: { id: setupRequest.id },
      data: {
        tenantSiteId: tenantSite.id,
        status: "SITE_PROVISIONING",
      },
    });

    if (domainPrimary) {
      await tx.siteDomain.upsert({
        where: {
          tenantSiteId_domain_domainType: {
            tenantSiteId: tenantSite.id,
            domain: domainPrimary,
            domainType: "PRIMARY",
          },
        },
        update: {
          status: "DETAILS_NEEDED",
          registrarNotes: "Created from paid setup request.",
        },
        create: {
          tenantSiteId: tenantSite.id,
          domain: domainPrimary,
          domainType: "PRIMARY",
          status: "DETAILS_NEEDED",
          registrarNotes: "Created from paid setup request.",
        },
      });
    }

    const domainFeeGbp =
      setupRequest.domainOption === "WE_REGISTER_DOMAIN"
        ? Math.max(setupRequest.setupTotalGbp - 149, 0)
        : 0;

    const existingSubscription = await tx.subscriptionRecord.findFirst({
      where: { tenantSiteId: tenantSite.id },
      select: { id: true },
    });

    if (existingSubscription) {
      await tx.subscriptionRecord.update({
        where: { id: existingSubscription.id },
        data: {
          status: "ACTIVE",
          setupFeeGbp: setupRequest.setupTotalGbp,
          monthlyFeeGbp: setupRequest.monthlyTotalGbp,
          domainFeeGbp,
        },
      });
    } else {
      await tx.subscriptionRecord.create({
        data: {
          tenantSiteId: tenantSite.id,
          status: "ACTIVE",
          setupFeeGbp: setupRequest.setupTotalGbp,
          monthlyFeeGbp: setupRequest.monthlyTotalGbp,
          domainFeeGbp,
          whatsappAddonEnabled: false,
        },
      });
    }

    await tx.customerSiteSettings.upsert({
      where: { tenantSiteId: tenantSite.id },
      update: {
        siteDisplayName: setupRequest.businessName,
        businessName: setupRequest.businessName,
        phone: setupRequest.contactPhone ?? undefined,
        email: setupRequest.contactEmail ?? undefined,
      },
      create: {
        tenantSiteId: tenantSite.id,
        siteDisplayName: setupRequest.businessName,
        businessName: setupRequest.businessName,
        phone: setupRequest.contactPhone ?? undefined,
        email: setupRequest.contactEmail ?? undefined,
      },
    });

    await tx.siteStatusEvent.create({
      data: {
        tenantSiteId: tenantSite.id,
        eventType: "SUBSCRIBER_SITE_CREATED_FROM_PAID_ORDER",
        message: "Blank subscriber site created from paid setup request.",
        metadata: {
          setupRequestId: setupRequest.id,
          paymentStatus: setupRequest.paymentStatus,
          stripeCheckoutSessionId: setupRequest.stripeCheckoutSessionId,
          stripeSubscriptionId: setupRequest.stripeSubscriptionId,
        },
      },
    });

    return {
      setupRequestId: setupRequest.id,
      tenantSiteId: tenantSite.id,
      siteSlug: tenantSite.slug,
      ...toUrls(tenantSite.slug),
      created: true,
    };
  });
}

