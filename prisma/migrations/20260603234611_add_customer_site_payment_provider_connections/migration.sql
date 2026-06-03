-- CreateTable
CREATE TABLE "CustomerSitePaymentProviderConnection" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connectionMode" TEXT NOT NULL DEFAULT 'MANUAL_ONLY',
    "environment" TEXT NOT NULL DEFAULT 'TEST',
    "providerAccountId" TEXT,
    "providerAccountName" TEXT,
    "providerAccountEmail" TEXT,
    "publicEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "setupNotes" TEXT,
    "secureSecretRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSitePaymentProviderConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSitePaymentProviderConnection_tenantSiteId_idx" ON "CustomerSitePaymentProviderConnection"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSitePaymentProviderConnection_provider_idx" ON "CustomerSitePaymentProviderConnection"("provider");

-- CreateIndex
CREATE INDEX "CustomerSitePaymentProviderConnection_tenantSiteId_connecti_idx" ON "CustomerSitePaymentProviderConnection"("tenantSiteId", "connectionStatus");

-- CreateIndex
CREATE INDEX "CustomerSitePaymentProviderConnection_tenantSiteId_publicEn_idx" ON "CustomerSitePaymentProviderConnection"("tenantSiteId", "publicEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSitePaymentProviderConnection_tenantSiteId_provider_key" ON "CustomerSitePaymentProviderConnection"("tenantSiteId", "provider");

-- AddForeignKey
ALTER TABLE "CustomerSitePaymentProviderConnection" ADD CONSTRAINT "CustomerSitePaymentProviderConnection_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
