-- AlterTable
ALTER TABLE "SetupRequest" ADD COLUMN     "paymentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentStartedAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "SetupRequest_paymentStatus_idx" ON "SetupRequest"("paymentStatus");

-- CreateIndex
CREATE INDEX "SetupRequest_stripeCheckoutSessionId_idx" ON "SetupRequest"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "SetupRequest_stripeSubscriptionId_idx" ON "SetupRequest"("stripeSubscriptionId");
