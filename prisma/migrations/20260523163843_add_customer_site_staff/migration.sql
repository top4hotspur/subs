-- CreateTable
CREATE TABLE "CustomerSiteStaffRole" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platformRole" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteStaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteStaffMember" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "roleId" TEXT,
    "displayName" TEXT NOT NULL,
    "roleLabel" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "customerSelectable" BOOLEAN NOT NULL DEFAULT false,
    "isSuperUser" BOOLEAN NOT NULL DEFAULT false,
    "availableWeekdays" JSONB,
    "serviceIds" JSONB,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteStaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRole_tenantSiteId_idx" ON "CustomerSiteStaffRole"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRole_tenantSiteId_active_idx" ON "CustomerSiteStaffRole"("tenantSiteId", "active");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRole_tenantSiteId_sortOrder_idx" ON "CustomerSiteStaffRole"("tenantSiteId", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffMember_tenantSiteId_idx" ON "CustomerSiteStaffMember"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffMember_tenantSiteId_active_idx" ON "CustomerSiteStaffMember"("tenantSiteId", "active");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffMember_tenantSiteId_sortOrder_idx" ON "CustomerSiteStaffMember"("tenantSiteId", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffMember_roleId_idx" ON "CustomerSiteStaffMember"("roleId");

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffRole" ADD CONSTRAINT "CustomerSiteStaffRole_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffMember" ADD CONSTRAINT "CustomerSiteStaffMember_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffMember" ADD CONSTRAINT "CustomerSiteStaffMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomerSiteStaffRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
