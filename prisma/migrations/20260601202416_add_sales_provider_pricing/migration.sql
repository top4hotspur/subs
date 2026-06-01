-- CreateTable
CREATE TABLE "SalesProviderPricing" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "estimatedMonthlyGbp" DECIMAL(10,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesProviderPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesProviderPricing_providerKey_key" ON "SalesProviderPricing"("providerKey");

-- CreateIndex
CREATE INDEX "SalesProviderPricing_active_idx" ON "SalesProviderPricing"("active");
