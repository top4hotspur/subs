-- AlterTable
ALTER TABLE "CustomerSiteStaffMember" ADD COLUMN     "staffAccessCodeHash" TEXT,
ADD COLUMN     "staffAccessEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CustomerSiteStaffMember_tenantSiteId_staffAccessEnabled_idx" ON "CustomerSiteStaffMember"("tenantSiteId", "staffAccessEnabled");
