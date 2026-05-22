-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "cityTown" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "emailSentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastMarketingEmailAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SalesLead_country_idx" ON "SalesLead"("country");

-- CreateIndex
CREATE INDEX "SalesLead_cityTown_idx" ON "SalesLead"("cityTown");
