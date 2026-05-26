-- AlterTable
ALTER TABLE "SetupRequest" ADD COLUMN     "confirmationAccessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "confirmationTokenCreatedAt" TIMESTAMP(3),
ADD COLUMN     "confirmationTokenHash" TEXT,
ADD COLUMN     "confirmationTokenLastUsedAt" TIMESTAMP(3);
