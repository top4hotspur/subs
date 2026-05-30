-- AlterTable
ALTER TABLE "CustomerSiteService" ADD COLUMN     "blockBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blockBookingSuggestedCounts" JSONB,
ADD COLUMN     "recurringEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringIntervals" JSONB;

-- AlterTable
ALTER TABLE "CustomerSiteSettings" ADD COLUMN     "customerBlockBookingsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringPaymentsEnabled" BOOLEAN NOT NULL DEFAULT false;
