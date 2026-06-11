-- AlterTable
ALTER TABLE "CustomerSiteSettings" ADD COLUMN     "homepageHeroImageUrl" TEXT,
ADD COLUMN     "setupGuidanceEnabled" BOOLEAN NOT NULL DEFAULT true;
