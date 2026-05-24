-- CreateTable
CREATE TABLE "CustomerSiteAdminUser" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "invitationStatus" TEXT NOT NULL,
    "accessCodeHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteAdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteAdminUser_tenantSiteId_idx" ON "CustomerSiteAdminUser"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteAdminUser_email_idx" ON "CustomerSiteAdminUser"("email");

-- CreateIndex
CREATE INDEX "CustomerSiteAdminUser_tenantSiteId_active_idx" ON "CustomerSiteAdminUser"("tenantSiteId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSiteAdminUser_tenantSiteId_email_key" ON "CustomerSiteAdminUser"("tenantSiteId", "email");

-- AddForeignKey
ALTER TABLE "CustomerSiteAdminUser" ADD CONSTRAINT "CustomerSiteAdminUser_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
