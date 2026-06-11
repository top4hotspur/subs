-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "pipelineVisibility" TEXT NOT NULL DEFAULT 'READY_FOR_CAMPAIGN';

-- CreateIndex
CREATE INDEX "SalesLead_pipelineVisibility_idx" ON "SalesLead"("pipelineVisibility");
