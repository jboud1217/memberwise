import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SiteDocument } from "./types/site-document";

// ─── S3 Client ────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined, // Falls back to IAM role in production
});

const BUCKET = process.env.S3_BUCKET_NAME || "memberwise-assets";
const CDN_URL = process.env.S3_CDN_URL; // Optional CloudFront URL

// ─── Key Helpers ──────────────────────────────────────

export function catalogKey(templateId: string) {
  return `catalog/${templateId}/template.json`;
}

export function orgSiteKey(orgId: string) {
  return `orgs/${orgId}/site.json`;
}

export function orgSnapshotKey(orgId: string) {
  return `orgs/${orgId}/_snapshot/site.json`;
}

export function orgAssetKey(orgId: string, filename: string) {
  return `orgs/${orgId}/assets/${filename}`;
}

export function catalogPreviewKey(templateId: string) {
  return `catalog/${templateId}/preview.png`;
}

// ─── Read / Write ─────────────────────────────────────

export async function getJsonFromS3<T = unknown>(key: string): Promise<T | null> {
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const body = await res.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

export async function putJsonToS3(key: string, data: unknown): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
}

export async function copyS3Object(sourceKey: string, destKey: string): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${sourceKey}`,
      Key: destKey,
    })
  );
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

// ─── Site Document Operations ─────────────────────────

export async function getSiteDocument(orgId: string): Promise<SiteDocument | null> {
  return getJsonFromS3<SiteDocument>(orgSiteKey(orgId));
}

export async function putSiteDocument(orgId: string, doc: SiteDocument): Promise<void> {
  doc.lastModified = new Date().toISOString();
  await putJsonToS3(orgSiteKey(orgId), doc);
}

export async function snapshotSiteDocument(orgId: string): Promise<void> {
  try {
    await copyS3Object(orgSiteKey(orgId), orgSnapshotKey(orgId));
  } catch {
    // No existing doc to snapshot — that's fine
  }
}

export async function revertToSnapshot(orgId: string): Promise<SiteDocument | null> {
  const snapshot = await getJsonFromS3<SiteDocument>(orgSnapshotKey(orgId));
  if (snapshot) {
    await putSiteDocument(orgId, snapshot);
  }
  return snapshot;
}

// ─── Catalog Operations ──────────────────────────────

export async function getCatalogTemplate(templateId: string): Promise<SiteDocument | null> {
  return getJsonFromS3<SiteDocument>(catalogKey(templateId));
}

export async function putCatalogTemplate(templateId: string, doc: SiteDocument): Promise<void> {
  await putJsonToS3(catalogKey(templateId), doc);
}

// ─── Presigned URLs for Image Upload ─────────────────

export async function getPresignedUploadUrl(
  orgId: string,
  filename: string,
  contentType: string = "image/jpeg"
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = orgAssetKey(orgId, filename);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  const publicUrl = CDN_URL ? `${CDN_URL}/${key}` : `https://${BUCKET}.s3.amazonaws.com/${key}`;
  return { uploadUrl, publicUrl };
}

// ─── Preview Image URLs ──────────────────────────────

export function getTemplatePreviewUrl(templateId: string): string {
  const key = catalogPreviewKey(templateId);
  return CDN_URL ? `${CDN_URL}/${key}` : `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

// ─── Asset Listing ──────────────────────────────────

export interface AssetInfo {
  key: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
}

export async function listOrgAssets(orgId: string): Promise<AssetInfo[]> {
  const prefix = `orgs/${orgId}/assets/`;
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  if (!res.Contents) return [];
  return res.Contents
    .filter((obj) => obj.Key && obj.Key !== prefix)
    .map((obj) => {
      const filename = obj.Key!.replace(prefix, "");
      return {
        key: obj.Key!,
        filename,
        url: CDN_URL ? `${CDN_URL}/${obj.Key}` : `https://${BUCKET}.s3.amazonaws.com/${obj.Key}`,
        size: obj.Size || 0,
        lastModified: obj.LastModified?.toISOString() || "",
      };
    });
}

export async function deleteOrgAsset(orgId: string, filename: string): Promise<void> {
  await deleteS3Object(orgAssetKey(orgId, filename));
}
