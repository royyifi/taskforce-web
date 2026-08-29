import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

function hasValidSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Foto sampul wajib dipilih." }, { status: 400 });
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WEBP." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_SIZE) return NextResponse.json({ error: "Ukuran foto maksimal 5 MB." }, { status: 400 });
    if (!hasValidSignature(file.type, buffer)) return NextResponse.json({ error: "File bukan gambar yang valid." }, { status: 400 });

    const filename = `${crypto.randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "activities");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), buffer);
    return NextResponse.json({ ok: true, url: `/uploads/activities/${filename}` });
  } catch (err) {
    console.error("activity upload error:", err);
    return NextResponse.json({ error: "Upload foto gagal." }, { status: 500 });
  }
}
