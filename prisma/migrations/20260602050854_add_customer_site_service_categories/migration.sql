-- AlterTable
ALTER TABLE "CustomerSiteService" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "CustomerSiteServiceCategory" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteServiceCategory_tenantSiteId_idx" ON "CustomerSiteServiceCategory"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteServiceCategory_tenantSiteId_active_idx" ON "CustomerSiteServiceCategory"("tenantSiteId", "active");

-- CreateIndex
CREATE INDEX "CustomerSiteServiceCategory_tenantSiteId_sortOrder_idx" ON "CustomerSiteServiceCategory"("tenantSiteId", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomerSiteService_categoryId_idx" ON "CustomerSiteService"("categoryId");

-- AddForeignKey
ALTER TABLE "CustomerSiteService" ADD CONSTRAINT "CustomerSiteService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CustomerSiteServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteServiceCategory" ADD CONSTRAINT "CustomerSiteServiceCategory_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
