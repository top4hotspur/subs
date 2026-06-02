-- AlterTable
ALTER TABLE "CustomerSiteBooking" ADD COLUMN     "customerSiteCustomerId" TEXT;

-- AlterTable
ALTER TABLE "CustomerSiteStaffMember" ADD COLUMN     "staffPermissions" JSONB;

-- CreateTable
CREATE TABLE "CustomerSiteCustomer" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "accessCodeHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteCustomer_tenantSiteId_idx" ON "CustomerSiteCustomer"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteCustomer_email_idx" ON "CustomerSiteCustomer"("email");

-- CreateIndex
CREATE INDEX "CustomerSiteCustomer_tenantSiteId_active_idx" ON "CustomerSiteCustomer"("tenantSiteId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSiteCustomer_tenantSiteId_email_key" ON "CustomerSiteCustomer"("tenantSiteId", "email");

-- CreateIndex
CREATE INDEX "CustomerSiteBooking_customerSiteCustomerId_idx" ON "CustomerSiteBooking"("customerSiteCustomerId");

-- AddForeignKey
ALTER TABLE "CustomerSiteBooking" ADD CONSTRAINT "CustomerSiteBooking_customerSiteCustomerId_fkey" FOREIGN KEY ("customerSiteCustomerId") REFERENCES "CustomerSiteCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteCustomer" ADD CONSTRAINT "CustomerSiteCustomer_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
