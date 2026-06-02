import { prisma } from "@/lib/db/prisma";
import type { SiteLifecycleAction } from "@/lib/sites/site-lifecycle";

function actionMessage(action: SiteLifecycleAction): string {
  switch (action) {
    case "MARK_DNS_INSTRUCTIONS_SENT":
      return "DNS instructions sent to customer or prepared for managed-domain setup.";
    case "MARK_DOMAIN_READY":
      return "Domain marked configured and ready for go-live.";
    case "MARK_SITE_LIVE":
      return "Subscriber site marked live.";
    case "SUSPEND_SITE":
      return "Subscriber site suspended by platform admin.";
    case "REACTIVATE_SITE":
      return "Subscriber site reactivated by platform admin.";
  }
}

function actionEventType(action: SiteLifecycleAction): string {
  switch (action) {
    case "MARK_DNS_INSTRUCTIONS_SENT":
      return "DNS_INSTRUCTIONS_SENT";
    case "MARK_DOMAIN_READY":
      return "DOMAIN_READY";
    case "MARK_SITE_LIVE":
      return "SITE_LIVE";
    case "SUSPEND_SITE":
      return "SITE_SUSPENDED";
    case "REACTIVATE_SITE":
      return "SITE_REACTIVATED";
  }
}

export async function applyTenantSiteLifecycleAction(tenantSiteId: string, action: SiteLifecycleAction) {
  return prisma.$transaction(async (tx) => {
    const site = await tx.tenantSite.findUnique({
      where: { id: tenantSiteId },
      include: { setupRequest: true, siteDomains: true },
    });
    if (!site) throw new Error("SITE_NOT_FOUND");

    const siteData: {
      status?: string;
      provisioningStatus?: string;
      domainStatus?: string;
      subscriptionStatus?: string;
    } = {};
    const domainData: { status?: string; registrarNotes?: string } = {};
    const setupRequestStatus = action === "MARK_SITE_LIVE" ? "SITE_LIVE" : undefined;

    if (action === "MARK_DNS_INSTRUCTIONS_SENT") {
      siteData.status = "PROVISIONED";
      siteData.provisioningStatus = "DOMAIN_PENDING";
      siteData.domainStatus = "DNS_INSTRUCTIONS_SENT";
      domainData.status = "DNS_INSTRUCTIONS_SENT";
      domainData.registrarNotes = "DNS instructions sent/prepared. Manual domain configuration still required.";
    }

    if (action === "MARK_DOMAIN_READY") {
      siteData.status = "PROVISIONED";
      siteData.provisioningStatus = "DOMAIN_READY";
      siteData.domainStatus = "DOMAIN_READY";
      domainData.status = "DOMAIN_READY";
      domainData.registrarNotes = "Domain marked configured/ready by platform admin.";
    }

    if (action === "MARK_SITE_LIVE") {
      siteData.status = "LIVE";
      siteData.provisioningStatus = "LIVE";
      siteData.domainStatus = site.domainPrimary ? "DOMAIN_READY" : site.domainStatus ?? "NOT_STARTED";
      siteData.subscriptionStatus = site.subscriptionStatus ?? "ACTIVE";
      domainData.status = "LIVE";
      domainData.registrarNotes = "Site marked live by platform admin.";
    }

    if (action === "SUSPEND_SITE") {
      siteData.status = "SUSPENDED";
      siteData.provisioningStatus = "SUSPENDED";
      siteData.subscriptionStatus = "SUSPENDED";
      siteData.domainStatus = "SUSPENDED";
      domainData.status = "SUSPENDED";
      domainData.registrarNotes = "Site suspended by platform admin.";
    }

    if (action === "REACTIVATE_SITE") {
      const hasDomain = Boolean(site.domainPrimary || site.siteDomains.length > 0);
      siteData.status = hasDomain ? "LIVE" : "PROVISIONED";
      siteData.provisioningStatus = hasDomain ? "LIVE" : "PROVISIONED";
      siteData.subscriptionStatus = "ACTIVE";
      siteData.domainStatus = hasDomain ? "DOMAIN_READY" : "NOT_STARTED";
      if (hasDomain) {
        domainData.status = "LIVE";
        domainData.registrarNotes = "Site reactivated by platform admin.";
      }
    }

    const updatedSite = await tx.tenantSite.update({
      where: { id: tenantSiteId },
      data: siteData,
      include: {
        siteDomains: true,
        provisioningTasks: { orderBy: { createdAt: "asc" } },
        statusEvents: { orderBy: { createdAt: "desc" }, take: 50 },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        setupRequest: true,
      },
    });

    if (Object.keys(domainData).length > 0) {
      await tx.siteDomain.updateMany({
        where: { tenantSiteId },
        data: domainData,
      });
    }

    if (setupRequestStatus && site.setupRequestId) {
      await tx.setupRequest.update({
        where: { id: site.setupRequestId },
        data: { status: setupRequestStatus },
      });
    }

    if (action === "MARK_DNS_INSTRUCTIONS_SENT") {
      await tx.siteProvisioningTask.updateMany({
        where: { tenantSiteId, taskType: "PREPARE_DNS" },
        data: { status: "DONE", notes: "DNS instructions sent/prepared." },
      });
    }
    if (action === "MARK_DOMAIN_READY") {
      await tx.siteProvisioningTask.updateMany({
        where: { tenantSiteId, taskType: "CONFIRM_DOMAIN_OPTION" },
        data: { status: "DONE", notes: "Domain configured and ready." },
      });
    }
    if (action === "MARK_SITE_LIVE") {
      await tx.siteProvisioningTask.updateMany({
        where: { tenantSiteId, taskType: "MARK_LIVE" },
        data: { status: "DONE", notes: "Site marked live." },
      });
    }

    await tx.siteStatusEvent.create({
      data: {
        tenantSiteId,
        eventType: actionEventType(action),
        message: actionMessage(action),
        metadata: { action },
      },
    });

    return updatedSite;
  });
}
