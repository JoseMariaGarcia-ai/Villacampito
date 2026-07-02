// File storage for uploaded images (e.g. offer images).
//
// By default, files are stored on the local disk under UPLOADS_DIR and
// served by Express as static files from /uploads/<key>. This works out of
// the box on any Node host with a persistent filesystem (VPS, Docker volume,
// etc.).
//
// If you deploy to a platform with an ephemeral filesystem (serverless,
// some PaaS), set S3_BUCKET (+ AWS_REGION and standard AWS credentials) to
// store files in S3 instead. @aws-sdk/client-s3 is already a dependency.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION;

/** Absolute path where locally-stored uploads live. */
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "..", "uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function s3PublicUrl(key: string): string {
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  }
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function putLocal(
  key: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const filePath = path.join(UPLOADS_DIR, key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, data as Uint8Array | string);
  return { key, url: `/uploads/${key}` };
}

async function putS3(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const clientConfig: Record<string, unknown> = { region: AWS_REGION };
  // Cloudflare R2 requires a custom endpoint
  if (process.env.S3_ENDPOINT) {
    clientConfig.endpoint = process.env.S3_ENDPOINT;
    clientConfig.forcePathStyle = true;
  }
  const client = new S3Client(clientConfig);
  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
      ACL: "public-read",
    })
  );
  return { key, url: s3PublicUrl(key) };
}

/** Store a file and return its key and a public URL. */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (S3_BUCKET) return putS3(key, data, contentType);
  return putLocal(key, data, contentType);
}

/** Resolve the public URL for an existing key. */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (S3_BUCKET) return { key, url: s3PublicUrl(key) };
  return { key, url: `/uploads/${key}` };
}
