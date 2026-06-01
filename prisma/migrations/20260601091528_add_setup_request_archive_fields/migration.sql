-- AlterTable
ALTER TABLE "SetupRequest" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SetupRequest_archivedAt_idx" ON "SetupRequest"("archivedAt");
