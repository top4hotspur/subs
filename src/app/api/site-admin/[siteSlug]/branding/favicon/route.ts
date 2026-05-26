import { NextRequest, NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  deleteSiteMediaObject,
  isSiteMediaStorageConfigured,
  uploadSiteMediaObject,
} from "@/lib/media/site-media-storage";
import {
  getCustomerSiteSettings,
  updateCustomerSiteBrandingMedia,
} from "@/lib/sites/customer-site-settings-repository";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

function storageNotConfigured() {
  return NextResponse.json({ ok: false, error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  return { tenantSiteId: site.id };
}

async function parseUploadFile(request: NextRequest): Promise<File | null> {
  const formData = await request.formData();
  const maybeFile = formData.get("file");
  if (!(maybeFile instanceof File)) return null;
  if (!maybeFile.name?.trim()) return null;
  return maybeFile;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!isSiteMediaStorageConfigured()) return storageNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const file = await parseUploadFile(request);
    if (!file) {
      return NextResponse.json({ ok: false, error: "FILE_REQUIRED" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadSiteMediaObject({
      tenantSiteId: resolved.tenantSiteId,
      kind: "favicon",
      fileName: file.name,
      contentType: file.type,
      bytes,
    });

    const current = await getCustomerSiteSettings(resolved.tenantSiteId);
    if (current?.faviconStorageKey) {
      await deleteSiteMediaObject({ key: current.faviconStorageKey }).catch(() => null);
    }

    const settings = await updateCustomerSiteBrandingMedia(resolved.tenantSiteId, {
      faviconUrl: uploaded.url,
      faviconStorageKey: uploaded.key,
      faviconContentType: uploaded.contentType,
      faviconFileName: uploaded.fileName,
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNSUPPORTED_MEDIA_TYPE") {
      return NextResponse.json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" }, { status: 400 });
    }
    if (message === "FILE_TOO_LARGE") {
      return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 400 });
    }
    if (message === "STORAGE_NOT_CONFIGURED") {
      return storageNotConfigured();
    }
    return NextResponse.json({ ok: false, error: "SITE_ADMIN_FAVICON_UPLOAD_FAILED", message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!isSiteMediaStorageConfigured()) return storageNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const current = await getCustomerSiteSettings(resolved.tenantSiteId);
    if (current?.faviconStorageKey) {
      await deleteSiteMediaObject({ key: current.faviconStorageKey });
    }

    const settings = await updateCustomerSiteBrandingMedia(resolved.tenantSiteId, {
      faviconUrl: null,
      faviconStorageKey: null,
      faviconContentType: null,
      faviconFileName: null,
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "STORAGE_NOT_CONFIGURED") {
      return storageNotConfigured();
    }
    return NextResponse.json({ ok: false, error: "SITE_ADMIN_FAVICON_DELETE_FAILED", message }, { status: 500 });
  }
}
