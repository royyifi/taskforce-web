import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengunggah foto." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File foto wajib dipilih." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format harus JPG, PNG, atau WEBP." }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    if (data.length > MAX_SIZE) return NextResponse.json({ error: "Ukuran foto maksimal 5 MB." }, { status: 400 });
    if (!validSignature(file.type, data)) return NextResponse.json({ error: "File bukan gambar yang valid." }, { status: 400 });
    const stored = await db.storedFile.create({ data: { mimeType: file.type, size: data.length, data } });
    return NextResponse.json({ ok: true, url: `/api/files/${stored.id}` });
  } catch (error) {
    console.error("file upload error:", error);
    return NextResponse.json({ error: "Upload foto gagal." }, { status: 500 });
  }
}
