import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export type SiteMediaKind = "logo" | "favicon";

const LOGO_ALLOWED_TYPES = new Set(["image/png", "image/svg+xml", "image/jpeg", "image/webp"]);
const FAVICON_ALLOWED_TYPES = new Set([
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const LOGO_MAX_BYTES = 1024 * 1024;
const FAVICON_MAX_BYTES = 512 * 1024;

let cachedClient: S3Client | null = null;

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "upload";
  const noPath = trimmed.replace(/[/\\]+/g, "-");
  const safe = noPath.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safe.slice(0, 140) || "upload";
}

function getStorageConfig() {
  const bucket = getOptionalServerEnv("SITE_MEDIA_BUCKET");
  const region = getOptionalServerEnv("SITE_MEDIA_REGION") ?? getOptionalServerEnv("AWS_REGION");
  return { bucket, region };
}

export function isSiteMediaStorageConfigured(): boolean {
  const config = getStorageConfig();
  return Boolean(config.bucket && config.region);
}

function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const region = getOptionalServerEnv("SITE_MEDIA_REGION") ?? getOptionalServerEnv("AWS_REGION");
  if (!region) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }
  cachedClient = new S3Client({ region });
  return cachedClient;
}

export function validateSiteMediaFile(kind: SiteMediaKind, contentType: string, byteLength: number) {
  const allowedTypes = kind === "logo" ? LOGO_ALLOWED_TYPES : FAVICON_ALLOWED_TYPES;
  const maxBytes = kind === "logo" ? LOGO_MAX_BYTES : FAVICON_MAX_BYTES;

  if (!allowedTypes.has(contentType)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  if (byteLength <= 0 || byteLength > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export function buildSiteMediaKey(tenantSiteId: string, kind: SiteMediaKind, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `sites/${tenantSiteId}/branding/${kind}/${Date.now()}-${randomUUID()}-${safeName}`;
}

function buildPublicUrl(key: string): string | null {
  const base = getOptionalServerEnv("SITE_MEDIA_PUBLIC_BASE_URL");
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function uploadSiteMediaObject(input: {
  tenantSiteId: string;
  kind: SiteMediaKind;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  const config = getStorageConfig();
  if (!config.bucket || !config.region) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  validateSiteMediaFile(input.kind, input.contentType, input.bytes.byteLength);
  const key = buildSiteMediaKey(input.tenantSiteId, input.kind, input.fileName);

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
    }),
  );

  return {
    key,
    url: buildPublicUrl(key),
    fileName: sanitizeFileName(input.fileName),
    contentType: input.contentType,
  };
}

export async function deleteSiteMediaObject(input: { key: string }) {
  const config = getStorageConfig();
  if (!config.bucket || !config.region) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }
  const key = input.key.trim();
  if (!key) return;
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}
