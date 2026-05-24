-- CreateTable
CREATE TABLE "CustomerSiteBooking" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "staffMemberId" TEXT,
    "staffName" TEXT,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_idx" ON "CustomerSiteBooking"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_preferredDate_idx" ON "CustomerSiteBooking"("tenantSiteId", "preferredDate");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_status_idx" ON "CustomerSiteBooking"("tenantSiteId", "status");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_staffMemberId_idx" ON "CustomerSiteBooking"("tenantSiteId", "staffMemberId");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_tenantSiteId_serviceId_idx" ON "CustomerSiteBooking"("tenantSiteId", "serviceId");

-- AddForeignKey
ALTER TABLE "CustomerSiteBooking" ADD CONSTRAINT "CustomerSiteBooking_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
