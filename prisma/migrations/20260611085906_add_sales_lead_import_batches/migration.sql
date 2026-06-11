-- CreateTable
CREATE TABLE "SalesLeadImportBatch" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT,
    "defaultIndustrySlug" TEXT,
    "defaultCityTown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLeadImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "extractedBusinessName" TEXT,
    "extractedAddress" TEXT,
    "extractedPostcode" TEXT,
    "extractedPhone" TEXT,
    "extractedWebsite" TEXT,
    "extractedEmail" TEXT,
    "leadSource" TEXT,
    "currentProvider" TEXT,
    "estimatedCurrentMonthlyCost" DECIMAL(10,2),
    "industrySlug" TEXT,
    "cityTown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "emailEnrichmentStatus" TEXT NOT NULL DEFAULT 'Missing email',
    "duplicateReason" TEXT,
    "notes" TEXT,
    "raw" JSONB,
    "approvedLeadId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLeadImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesLeadImportBatch_sourceType_idx" ON "SalesLeadImportBatch"("sourceType");

-- CreateIndex
CREATE INDEX "SalesLeadImportBatch_status_idx" ON "SalesLeadImportBatch"("status");

-- CreateIndex
CREATE INDEX "SalesLeadImportBatch_createdAt_idx" ON "SalesLeadImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_batchId_idx" ON "SalesLeadImportRow"("batchId");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_status_idx" ON "SalesLeadImportRow"("status");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_leadSource_idx" ON "SalesLeadImportRow"("leadSource");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_industrySlug_idx" ON "SalesLeadImportRow"("industrySlug");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_cityTown_idx" ON "SalesLeadImportRow"("cityTown");

-- CreateIndex
CREATE INDEX "SalesLeadImportRow_approvedLeadId_idx" ON "SalesLeadImportRow"("approvedLeadId");

-- AddForeignKey
ALTER TABLE "SalesLeadImportRow" ADD CONSTRAINT "SalesLeadImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SalesLeadImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadImportRow" ADD CONSTRAINT "SalesLeadImportRow_approvedLeadId_fkey" FOREIGN KEY ("approvedLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
