-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "address" TEXT,
ADD COLUMN     "currentProvider" TEXT,
ADD COLUMN     "doNotContactReason" TEXT,
ADD COLUMN     "estimatedCurrentMonthlyCost" DECIMAL(10,2),
ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "marketingStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SalesCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industrySlug" TEXT,
    "serviceArea" TEXT,
    "campaignLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCampaignEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "leadId" TEXT,
    "resendEmailId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "clickedUrl" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesCampaign_industrySlug_idx" ON "SalesCampaign"("industrySlug");

-- CreateIndex
CREATE INDEX "SalesCampaign_serviceArea_idx" ON "SalesCampaign"("serviceArea");

-- CreateIndex
CREATE INDEX "SalesCampaign_campaignLevel_idx" ON "SalesCampaign"("campaignLevel");

-- CreateIndex
CREATE INDEX "SalesCampaign_status_idx" ON "SalesCampaign"("status");

-- CreateIndex
CREATE INDEX "SalesCampaignRecipient_campaignId_idx" ON "SalesCampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "SalesCampaignRecipient_leadId_idx" ON "SalesCampaignRecipient"("leadId");

-- CreateIndex
CREATE INDEX "SalesCampaignRecipient_status_idx" ON "SalesCampaignRecipient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCampaignRecipient_campaignId_leadId_key" ON "SalesCampaignRecipient"("campaignId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCampaignEvent_eventId_key" ON "SalesCampaignEvent"("eventId");

-- CreateIndex
CREATE INDEX "SalesCampaignEvent_campaignId_idx" ON "SalesCampaignEvent"("campaignId");

-- CreateIndex
CREATE INDEX "SalesCampaignEvent_leadId_idx" ON "SalesCampaignEvent"("leadId");

-- CreateIndex
CREATE INDEX "SalesCampaignEvent_eventType_idx" ON "SalesCampaignEvent"("eventType");

-- CreateIndex
CREATE INDEX "SalesCampaignEvent_createdAt_idx" ON "SalesCampaignEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SalesLead_postcode_idx" ON "SalesLead"("postcode");

-- CreateIndex
CREATE INDEX "SalesLead_serviceArea_idx" ON "SalesLead"("serviceArea");

-- CreateIndex
CREATE INDEX "SalesLead_marketingStatus_idx" ON "SalesLead"("marketingStatus");

-- AddForeignKey
ALTER TABLE "SalesCampaignRecipient" ADD CONSTRAINT "SalesCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SalesCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCampaignRecipient" ADD CONSTRAINT "SalesCampaignRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCampaignEvent" ADD CONSTRAINT "SalesCampaignEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SalesCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCampaignEvent" ADD CONSTRAINT "SalesCampaignEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
