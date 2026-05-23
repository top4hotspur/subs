-- CreateTable
CREATE TABLE "CustomerSiteSettings" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "siteDisplayName" TEXT,
    "businessName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "openingHoursSummary" TEXT,
    "heroHeadline" TEXT,
    "heroSubheading" TEXT,
    "visualThemeId" TEXT,
    "colourPaletteId" TEXT,
    "currency" TEXT DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteService" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2),
    "durationMinutes" INTEGER,
    "bufferAfterMinutes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rolePriceOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSiteSettings_tenantSiteId_key" ON "CustomerSiteSettings"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteService_tenantSiteId_idx" ON "CustomerSiteService"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteService_active_idx" ON "CustomerSiteService"("active");

-- CreateIndex
CREATE INDEX "CustomerSiteService_sortOrder_idx" ON "CustomerSiteService"("sortOrder");

-- AddForeignKey
ALTER TABLE "CustomerSiteSettings" ADD CONSTRAINT "CustomerSiteSettings_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteService" ADD CONSTRAINT "CustomerSiteService_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
