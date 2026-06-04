-- AlterTable
ALTER TABLE "CustomerSiteBooking" ADD COLUMN     "paymentProviderAccountId" TEXT,
ADD COLUMN     "paymentProviderCheckoutExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_paymentProviderAccountId_idx" ON "CustomerSiteBooking"("paymentProviderAccountId");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_paymentProviderCheckoutExpiresAt_idx" ON "CustomerSiteBooking"("paymentProviderCheckoutExpiresAt");
