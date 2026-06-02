-- AlterTable
ALTER TABLE "CustomerSiteBooking" ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "CustomerSiteSettings" ADD COLUMN     "policyDefaultAccepted" BOOLEAN NOT NULL DEFAULT false;
