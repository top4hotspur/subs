-- CreateTable
CREATE TABLE "CustomerSiteStaffRotaDay" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "working" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteStaffRotaDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteStaffBreakWindow" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "rotaDayId" TEXT,
    "weekday" TEXT NOT NULL,
    "label" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteStaffBreakWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteBusinessClosure" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteBusinessClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSiteStaffHoliday" (
    "id" TEXT NOT NULL,
    "tenantSiteId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSiteStaffHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRotaDay_tenantSiteId_idx" ON "CustomerSiteStaffRotaDay"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRotaDay_staffMemberId_idx" ON "CustomerSiteStaffRotaDay"("staffMemberId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffRotaDay_tenantSiteId_staffMemberId_weekday_idx" ON "CustomerSiteStaffRotaDay"("tenantSiteId", "staffMemberId", "weekday");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffBreakWindow_tenantSiteId_idx" ON "CustomerSiteStaffBreakWindow"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffBreakWindow_staffMemberId_idx" ON "CustomerSiteStaffBreakWindow"("staffMemberId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffBreakWindow_rotaDayId_idx" ON "CustomerSiteStaffBreakWindow"("rotaDayId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffBreakWindow_tenantSiteId_staffMemberId_wee_idx" ON "CustomerSiteStaffBreakWindow"("tenantSiteId", "staffMemberId", "weekday");

-- CreateIndex
CREATE INDEX "CustomerSiteBusinessClosure_tenantSiteId_idx" ON "CustomerSiteBusinessClosure"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteBusinessClosure_tenantSiteId_date_idx" ON "CustomerSiteBusinessClosure"("tenantSiteId", "date");

-- CreateIndex
CREATE INDEX "CustomerSiteBusinessClosure_tenantSiteId_active_idx" ON "CustomerSiteBusinessClosure"("tenantSiteId", "active");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffHoliday_tenantSiteId_idx" ON "CustomerSiteStaffHoliday"("tenantSiteId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffHoliday_staffMemberId_idx" ON "CustomerSiteStaffHoliday"("staffMemberId");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffHoliday_tenantSiteId_date_idx" ON "CustomerSiteStaffHoliday"("tenantSiteId", "date");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffHoliday_tenantSiteId_staffMemberId_date_idx" ON "CustomerSiteStaffHoliday"("tenantSiteId", "staffMemberId", "date");

-- CreateIndex
CREATE INDEX "CustomerSiteStaffHoliday_tenantSiteId_active_idx" ON "CustomerSiteStaffHoliday"("tenantSiteId", "active");

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffRotaDay" ADD CONSTRAINT "CustomerSiteStaffRotaDay_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffRotaDay" ADD CONSTRAINT "CustomerSiteStaffRotaDay_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "CustomerSiteStaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffBreakWindow" ADD CONSTRAINT "CustomerSiteStaffBreakWindow_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffBreakWindow" ADD CONSTRAINT "CustomerSiteStaffBreakWindow_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "CustomerSiteStaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffBreakWindow" ADD CONSTRAINT "CustomerSiteStaffBreakWindow_rotaDayId_fkey" FOREIGN KEY ("rotaDayId") REFERENCES "CustomerSiteStaffRotaDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteBusinessClosure" ADD CONSTRAINT "CustomerSiteBusinessClosure_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffHoliday" ADD CONSTRAINT "CustomerSiteStaffHoliday_tenantSiteId_fkey" FOREIGN KEY ("tenantSiteId") REFERENCES "TenantSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSiteStaffHoliday" ADD CONSTRAINT "CustomerSiteStaffHoliday_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "CustomerSiteStaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
