-- AlterTable
ALTER TABLE "SiteDomain" ADD COLUMN     "dnsLastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "dnsStatus" TEXT,
ADD COLUMN     "dnsVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "domainNotes" TEXT,
ADD COLUMN     "domainSetupMode" TEXT,
ADD COLUMN     "domainStatus" TEXT,
ADD COLUMN     "expectedDnsTarget" TEXT,
ADD COLUMN     "expectedNameservers" JSONB,
ADD COLUMN     "goLiveRequestedAt" TIMESTAMP(3),
ADD COLUMN     "lastDnsCheckResult" JSONB,
ADD COLUMN     "nameserverInstructionsSentAt" TIMESTAMP(3),
ADD COLUMN     "sslStatus" TEXT,
ADD COLUMN     "wentLiveAt" TIMESTAMP(3);
