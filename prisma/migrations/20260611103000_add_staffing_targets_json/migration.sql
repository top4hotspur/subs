-- Add tenant-scoped staffing target settings for business-admin rota coverage.
ALTER TABLE "CustomerSiteSettings" ADD COLUMN "staffingTargetsJson" JSONB;
