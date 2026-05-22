-- CreateTable
CREATE TABLE "SalesLead" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "location" TEXT,
    "industrySlug" TEXT,
    "industryLabel" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadEvent" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesLead_status_idx" ON "SalesLead"("status");

-- CreateIndex
CREATE INDEX "SalesLead_industrySlug_idx" ON "SalesLead"("industrySlug");

-- CreateIndex
CREATE INDEX "SalesLead_businessName_idx" ON "SalesLead"("businessName");

-- CreateIndex
CREATE INDEX "SalesLead_location_idx" ON "SalesLead"("location");

-- CreateIndex
CREATE INDEX "SalesLead_createdAt_idx" ON "SalesLead"("createdAt");

-- CreateIndex
CREATE INDEX "SalesLeadEvent_salesLeadId_idx" ON "SalesLeadEvent"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesLeadEvent_createdAt_idx" ON "SalesLeadEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "SalesLeadEvent" ADD CONSTRAINT "SalesLeadEvent_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
