-- AlterTable
ALTER TABLE "TenantSite" ADD COLUMN     "domainStatus" TEXT,
ADD COLUMN     "provisioningStatus" TEXT,
ADD COLUMN     "setupRequestId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "whatsappAddonEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SiteDomain" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "domainType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "registrarNotes" TEXT,
    "dnsInstructions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteProvisioningTask" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "setupRequestId" TEXT,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteProvisioningTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteStatusEvent" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRecord" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "setupFeeGbp" INTEGER NOT NULL,
    "monthlyFeeGbp" INTEGER NOT NULL,
    "domainFeeGbp" INTEGER NOT NULL,
    "whatsappAddonEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteDomain_tenantSiteId_idx" ON "SiteDomain"("tenantSiteId");

-- CreateIndex
CREATE INDEX "SiteDomain_domain_idx" ON "SiteDomain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "SiteDomain_tenantSiteId_domain_domainType_key" ON "SiteDomain"("tenantSiteId", "domain", "domainType");

-- CreateIndex
CREATE INDEX "SiteProvisioningTask_tenantSiteId_idx" ON "SiteProvisioningTask"("tenantSiteId");

-- CreateIndex
CREATE INDEX "SiteProvisioningTask_setupRequestId_idx" ON "SiteProvisioningTask"("setupRequestId");

-- CreateIndex
CREATE INDEX "SiteProvisioningTask_status_idx" ON "SiteProvisioningTask"("status");

-- CreateIndex
CREATE INDEX "SiteStatusEvent_tenantSiteId_idx" ON "SiteStatusEvent"("tenantSiteId");

-- CreateIndex
CREATE INDEX "SiteStatusEvent_createdAt_idx" ON "SiteStatusEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionRecord_tenantSiteId_idx" ON "SubscriptionRecord"("tenantSiteId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSite_setupRequestId_key" ON "TenantSite"("setupRequestId");

-- AddForeignKey
ALTER TABLE "TenantSite" ADD CONSTRAINT "TenantSite_setupRequestId_fkey" FOREIGN KEY ("setupRequestId") REFERENCES "SetupRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDomain" ADD CONSTRAINT "SiteDomain_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteProvisioningTask" ADD CONSTRAINT "SiteProvisioningTask_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteProvisioningTask" ADD CONSTRAINT "SiteProvisioningTask_setupRequestId_fkey" FOREIGN KEY ("setupRequestId") REFERENCES "SetupRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteStatusEvent" ADD CONSTRAINT "SiteStatusEvent_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRecord" ADD CONSTRAINT "SubscriptionRecord_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

