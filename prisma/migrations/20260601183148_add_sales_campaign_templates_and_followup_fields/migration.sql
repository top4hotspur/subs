-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "lastCampaignStep" TEXT,
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SalesCampaignTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCampaignTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesCampaignTemplate_templateKey_key" ON "SalesCampaignTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "SalesCampaignTemplate_channel_idx" ON "SalesCampaignTemplate"("channel");

-- CreateIndex
CREATE INDEX "SalesLead_lastCampaignStep_idx" ON "SalesLead"("lastCampaignStep");

-- CreateIndex
CREATE INDEX "SalesLead_snoozedUntil_idx" ON "SalesLead"("snoozedUntil");
