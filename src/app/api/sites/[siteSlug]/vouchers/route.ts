import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { publicGiftVoucherRequestSchema } from "@/lib/sites/customer-site-voucher-schema";
import { createPendingGiftVoucher } from "@/lib/sites/customer-site-voucher-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

function publicError(error: unknown): { message: string; status: number; code: string } {
  const code = error instanceof Error ? error.message : "VOUCHER_REQUEST_FAILED";
  if (code === "GIFT_VOUCHERS_NOT_ENABLED") return { code, status: 404, message: "Gift vouchers are not currently available for this site." };
  if (code === "VOUCHER_AMOUNT_NOT_ALLOWED") return { code, status: 400, message: "Choose one of the available voucher amounts." };
  if (code === "VOUCHER_DELIVERY_METHOD_NOT_ALLOWED") return { code, status: 400, message: "Choose one of the available delivery options." };
  if (code === "RECIPIENT_EMAIL_REQUIRED") return { code, status: 400, message: "Recipient email is required for digital vouchers." };
  if (code === "RECIPIENT_ADDRESS_REQUIRED") return { code, status: 400, message: "Recipient address is required for postal vouchers." };
  return { code: "VOUCHER_REQUEST_FAILED", status: 500, message: "Could not submit this voucher request. Please try again." };
}

export async function POST(request: NextRequest, context: { params: Promise<{ siteSlug: string }> }) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const parsed = publicGiftVoucherRequestSchema.parse(await request.json());
    const result = await createPendingGiftVoucher(site.id, parsed);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    const safe = publicError(error);
    return NextResponse.json({ ok: false, error: safe.code, message: safe.message }, { status: safe.status });
  }
}
