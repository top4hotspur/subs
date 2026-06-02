-- AlterTable
ALTER TABLE "CustomerSiteBooking" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "refundGuidance" TEXT,
ADD COLUMN     "refundStatus" TEXT;

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_refundStatus_idx" ON "CustomerSiteBooking"("tenantSiteId", "refundStatus");
