-- AlterTable
ALTER TABLE "CustomerSiteSettings" ADD COLUMN     "acceptCardPayments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCashPayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowInStorePaymentRecording" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellationFullRefundNoticeDays" INTEGER DEFAULT 1,
ADD COLUMN     "cancellationNoRefundWithinDays" INTEGER DEFAULT 1,
ADD COLUMN     "cancellationPolicyNote" TEXT,
ADD COLUMN     "paymentProcessorAccountRef" TEXT,
ADD COLUMN     "paymentProcessorName" TEXT,
ADD COLUMN     "paymentProcessorNotes" TEXT,
ADD COLUMN     "paymentProcessorSetupMode" TEXT,
ADD COLUMN     "requireBookingPrepayment" BOOLEAN NOT NULL DEFAULT false;
