-- AlterTable
ALTER TABLE "CustomerSiteCustomer" ADD COLUMN     "crmNotes" TEXT,
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingOptInAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CustomerSiteContactEnquiry" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "customerSiteCustomerId" TEXT,
    "bookingId" TEXT,
    "purpose" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "emailStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_tenantSiteId_idx" ON "CustomerSiteContactEnquiry"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_tenantSiteId_status_idx" ON "CustomerSiteContactEnquiry"("tenantSiteId", "status");

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_tenantSiteId_email_idx" ON "CustomerSiteContactEnquiry"("tenantSiteId", "email");

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_tenantSiteId_createdAt_idx" ON "CustomerSiteContactEnquiry"("tenantSiteId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_customerSiteCustomerId_idx" ON "CustomerSiteContactEnquiry"("customerSiteCustomerId");

-- CreateIndex
CREATE INDEX "CustomerSiteContactEnquiry_bookingId_idx" ON "CustomerSiteContactEnquiry"("bookingId");

-- CreateIndex
CREATE INDEX "CustomerSiteCustomer_tenantSiteId_marketingOptIn_idx" ON "CustomerSiteCustomer"("tenantSiteId", "marketingOptIn");

-- AddForeignKey
ALTER TABLE "CustomerSiteContactEnquiry" ADD CONSTRAINT "CustomerSiteContactEnquiry_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
