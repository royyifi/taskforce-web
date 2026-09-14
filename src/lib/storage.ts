import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

export const r2Enabled = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);

const r2 = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
    })
  : null;

function publicUrl(key: string) {
  return `${R2_PUBLIC_URL}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function putStoredFile(params: { id: string; data: Buffer; mimeType: string }) {
  if (!r2) {
    const stored = await db.storedFile.create({ data: { id: params.id, mimeType: params.mimeType, size: params.data.length, data: params.data } });
    return { id: stored.id, url: `/api/files/${stored.id}` };
  }

  const key = `files/${params.id}`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key, Body: params.data, ContentType: params.mimeType, ContentLength: params.data.length }));
  return { id: params.id, url: publicUrl(key) };
}

export async function getStoredFile(id: string) {
  if (!r2) return db.storedFile.findUnique({ where: { id } });

  try {
    const response = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: `files/${id}` }));
    if (!response.Body) return null;
    const bytes = Buffer.from(await response.Body.transformToByteArray());
    return { mimeType: response.ContentType || "application/octet-stream", size: bytes.length, data: bytes };
  } catch {
    return db.storedFile.findUnique({ where: { id } });
  }
}

export async function deleteStoredFile(id: string) {
  if (r2) await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: `files/${id}` }));
  await db.storedFile.deleteMany({ where: { id } });
}
