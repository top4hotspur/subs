-- AlterTable
ALTER TABLE "CustomerSiteBusinessClosure" ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "endDate" TEXT;

-- AlterTable
ALTER TABLE "CustomerSiteStaffHoliday" ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "notes" TEXT;
