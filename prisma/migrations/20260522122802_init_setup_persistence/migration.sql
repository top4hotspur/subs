-- CreateTable
CREATE TABLE "TenantSite" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "industrySlug" TEXT,
    "status" TEXT NOT NULL,
    "domainPrimary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoDraftSnapshot" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT,
    "setupRequestId" TEXT,
    "templateSlug" TEXT NOT NULL,
    "draftName" TEXT,
    "draftJson" JSONB NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoDraftSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupRequest" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT,
    "demoDraftSnapshotId" TEXT,
    "industrySlug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "domainOption" TEXT NOT NULL,
    "existingDomain" TEXT,
    "desiredDomain" TEXT,
    "communicationOption" TEXT NOT NULL,
    "setupTotalGbp" INTEGER NOT NULL,
    "monthlyTotalGbp" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupRequestEvent" (
    "id" TEXT NOT NULL,
    "setupRequestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantSite_slug_key" ON "TenantSite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DemoDraftSnapshot_setupRequestId_key" ON "DemoDraftSnapshot"("setupRequestId");

-- CreateIndex
CREATE INDEX "DemoDraftSnapshot_tenantSiteId_idx" ON "DemoDraftSnapshot"("tenantSiteId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupRequest_demoDraftSnapshotId_key" ON "SetupRequest"("demoDraftSnapshotId");

-- CreateIndex
CREATE INDEX "SetupRequest_industrySlug_idx" ON "SetupRequest"("industrySlug");

-- CreateIndex
CREATE INDEX "SetupRequest_status_idx" ON "SetupRequest"("status");

-- CreateIndex
CREATE INDEX "SetupRequest_createdAt_idx" ON "SetupRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SetupRequest_tenantSiteId_idx" ON "SetupRequest"("tenantSiteId");

-- CreateIndex
CREATE INDEX "SetupRequestEvent_setupRequestId_idx" ON "SetupRequestEvent"("setupRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdminUser_email_key" ON "PlatformAdminUser"("email");

-- AddForeignKey
ALTER TABLE "DemoDraftSnapshot" ADD CONSTRAINT "DemoDraftSnapshot_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupRequest" ADD CONSTRAINT "SetupRequest_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupRequest" ADD CONSTRAINT "SetupRequest_demoDraftSnapshotId_fkey" FOREIGN KEY ("demoDraftSnapshotId") REFERENCES "DemoDraftSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupRequestEvent" ADD CONSTRAINT "SetupRequestEvent_setupRequestId_fkey" FOREIGN KEY ("setupRequestId") REFERENCES "SetupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
