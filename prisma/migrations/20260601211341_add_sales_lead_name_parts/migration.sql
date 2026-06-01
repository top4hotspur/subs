-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "contactFirstName" TEXT,
ADD COLUMN     "contactLastName" TEXT;

-- CreateIndex
CREATE INDEX "SalesLead_contactFirstName_idx" ON "SalesLead"("contactFirstName");

-- CreateIndex
CREATE INDEX "SalesLead_contactLastName_idx" ON "SalesLead"("contactLastName");
