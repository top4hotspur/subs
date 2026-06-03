-- CreateTable
CREATE TABLE "CustomerSiteMarketingCampaign" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "audienceType" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteMarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteMarketingCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "customerSiteCustomerId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteMarketingCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaign_tenantSiteId_idx" ON "CustomerSiteMarketingCampaign"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaign_tenantSiteId_status_idx" ON "CustomerSiteMarketingCampaign"("tenantSiteId", "status");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaign_tenantSiteId_createdAt_idx" ON "CustomerSiteMarketingCampaign"("tenantSiteId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaignRecipient_tenantSiteId_idx" ON "CustomerSiteMarketingCampaignRecipient"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaignRecipient_campaignId_idx" ON "CustomerSiteMarketingCampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaignRecipient_customerSiteCustomer_idx" ON "CustomerSiteMarketingCampaignRecipient"("customerSiteCustomerId");

-- CreateIndex
CREATE INDEX "CustomerSiteMarketingCampaignRecipient_status_idx" ON "CustomerSiteMarketingCampaignRecipient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSiteMarketingCampaignRecipient_campaignId_email_key" ON "CustomerSiteMarketingCampaignRecipient"("campaignId", "email");

-- AddForeignKey
ALTER TABLE "CustomerSiteMarketingCampaign" ADD CONSTRAINT "CustomerSiteMarketingCampaign_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteMarketingCampaignRecipient" ADD CONSTRAINT "CustomerSiteMarketingCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CustomerSiteMarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteMarketingCampaignRecipient" ADD CONSTRAINT "CustomerSiteMarketingCampaignRecipient_customerSiteCustome_fkey" FOREIGN KEY ("customerSiteCustomerId") REFERENCES "CustomerSiteCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
