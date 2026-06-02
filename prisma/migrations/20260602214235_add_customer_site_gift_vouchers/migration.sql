-- AlterTable
ALTER TABLE "CustomerSiteSettings" ADD COLUMN     "giftVoucherSettingsJson" JSONB;

-- CreateTable
CREATE TABLE "CustomerSiteGiftVoucher" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "remainingAmountPence" INTEGER,
    "postageAmountPence" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "deliveryMethod" TEXT NOT NULL,
    "purchaserName" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "purchaserPhone" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "recipientAddress" TEXT,
    "recipientPostcode" TEXT,
    "message" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByStaffId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteGiftVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteGiftVoucher_tenantSiteId_idx" ON "CustomerSiteGiftVoucher"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteGiftVoucher_tenantSiteId_status_idx" ON "CustomerSiteGiftVoucher"("tenantSiteId", "status");

-- CreateIndex
CREATE INDEX "CustomerSiteGiftVoucher_tenantSiteId_paymentStatus_idx" ON "CustomerSiteGiftVoucher"("tenantSiteId", "paymentStatus");

-- CreateIndex
CREATE INDEX "CustomerSiteGiftVoucher_tenantSiteId_createdAt_idx" ON "CustomerSiteGiftVoucher"("tenantSiteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSiteGiftVoucher_tenantSiteId_voucherCode_key" ON "CustomerSiteGiftVoucher"("tenantSiteId", "voucherCode");

-- AddForeignKey
ALTER TABLE "CustomerSiteGiftVoucher" ADD CONSTRAINT "CustomerSiteGiftVoucher_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
