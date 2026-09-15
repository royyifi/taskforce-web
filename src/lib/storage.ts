import { createHash } from "node:crypto";
import { db } from "@/lib/db";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryEnabled = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

function cloudinarySignature(params: Record<string, string>) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${CLOUDINARY_API_SECRET}`).digest("hex");
}

function cloudinaryUrl(resourceType: "image" | "raw", id: string) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/files/${encodeURIComponent(id)}`;
}

export async function putStoredFile(params: { id: string; data: Buffer; mimeType: string }) {
  async function storeInDatabase() {
    const stored = await db.storedFile.create({ data: { id: params.id, mimeType: params.mimeType, size: params.data.length, data: params.data } });
    return { id: stored.id, url: `/api/files/${stored.id}` };
  }

  if (!cloudinaryEnabled) return storeInDatabase();

  const timestamp = String(Math.floor(Date.now() / 1000));
  const publicId = `files/${params.id}`;
  const resourceType = params.mimeType.startsWith("image/") ? "image" : "raw";
  const signature = cloudinarySignature({ public_id: publicId, timestamp });
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(params.data)], { type: params.mimeType }), params.id);
  form.append("api_key", CLOUDINARY_API_KEY!);
  form.append("timestamp", timestamp);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: form });
  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    console.error(`Cloudinary upload failed (${response.status}): ${result.error?.message || "Unknown error"}`);
    return storeInDatabase();
  }
  await db.storedFile.create({ data: { id: params.id, mimeType: params.mimeType, size: params.data.length, data: Buffer.alloc(0) } });
  return { id: params.id, url: result.secure_url };
}

export async function getStoredFile(id: string) {
  const legacy = await db.storedFile.findUnique({ where: { id } });
  if (!cloudinaryEnabled) return legacy;

  // New uploads are public in Cloudinary; legacy database blobs remain fallback.
  for (const resourceType of ["image", "raw"] as const) {
    try {
      const response = await fetch(cloudinaryUrl(resourceType, id));
      if (!response.ok) continue;
      const data = Buffer.from(await response.arrayBuffer());
      return { mimeType: response.headers.get("content-type") || legacy?.mimeType || "application/octet-stream", size: data.length, data };
    } catch {
      // Try the other Cloudinary resource type before falling back to legacy storage.
    }
  }
  return legacy;
}

export async function deleteStoredFileById(id: string) {
  await db.storedFile.deleteMany({ where: { id } });
}

export async function deleteStoredFile(id: string) {
  await deleteStoredFileById(id);
}
