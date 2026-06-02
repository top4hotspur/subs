-- AlterTable
ALTER TABLE "CustomerSiteBooking" ADD COLUMN     "paymentAmountPence" INTEGER,
ADD COLUMN     "paymentCurrency" TEXT,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentProviderPaymentIntentId" TEXT,
ADD COLUMN     "paymentProviderSessionId" TEXT;

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_paymentProviderSessionId_idx" ON "CustomerSiteBooking"("paymentProviderSessionId");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_paymentProviderPaymentIntentId_idx" ON "CustomerSiteBooking"("paymentProviderPaymentIntentId");
