import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { siteGoLiveCustomerEmail } from "@/lib/email/email-templates";
import { applyTenantSiteLifecycleAction } from "@/lib/sites/site-lifecycle-repository";
import { SITE_LIFECYCLE_ACTIONS } from "@/lib/sites/site-lifecycle";

const cuid = z.string().cuid();
const actionSchema = z.object({
  action: z.enum(SITE_LIFECYCLE_ACTIONS),
});

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

function absoluteAppUrl(path: string): string {
  const baseUrl = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}${path}` : path;
}

function publicSiteUrl(site: {
  domainPrimary?: string | null;
  slug: string;
}): string {
  const domain = site.domainPrimary?.trim();
  if (domain) {
    if (/^https?:\/\//i.test(domain)) return domain;
    return `https://${domain}`;
  }
  return absoluteAppUrl(`/sites/${encodeURIComponent(site.slug)}`);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const tenantSiteId = cuid.parse(id);
    const body = await request.json();
    const parsed = actionSchema.parse(body);
    const site = await applyTenantSiteLifecycleAction(tenantSiteId, parsed.action);
    let emailStatus: string | null = null;
    let emailSent = false;
    if (parsed.action === "MARK_SITE_LIVE") {
      const targetEmail = site.setupRequest?.contactEmail?.trim();
      if (targetEmail) {
        const email = siteGoLiveCustomerEmail({
          businessName: site.displayName,
          publicUrl: publicSiteUrl(site),
          adminUrl: absoluteAppUrl(`/site-admin/${encodeURIComponent(site.slug)}`),
        });
        const emailResult = await sendTransactionalEmail({
          to: targetEmail,
          subject: email.subject,
          text: email.text,
          html: email.html,
          replyTo: getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL"),
        });
        emailSent = emailResult.ok;
        emailStatus = emailResult.ok ? "SENT" : emailResult.reason;
      } else {
        emailStatus = "NO_CONTACT_EMAIL";
      }
    }
    return NextResponse.json({ ok: true, site, action: parsed.action, emailSent, emailStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SITE_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_LIFECYCLE_ACTION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
