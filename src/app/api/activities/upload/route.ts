import { NextResponse } from "next/server";
import { putStoredFile } from "@/lib/storage";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "application/pdf") return bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === "%PDF";
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File wajib dipilih." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format harus JPG, PNG, WEBP, atau PDF." }, { status: 400 });
    const isPdf = file.type === "application/pdf";
    const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
    const data = Buffer.from(await file.arrayBuffer());
    if (data.length > maxSize) return NextResponse.json({ error: isPdf ? "Ukuran PDF maksimal 10 MB." : "Ukuran foto maksimal 5 MB." }, { status: 400 });
    if (!validSignature(file.type, data)) return NextResponse.json({ error: "File tidak valid." }, { status: 400 });
    const id = `file_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const { url } = await putStoredFile({ id, data, mimeType: file.type });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("activity upload error:", error);
    return NextResponse.json({ error: "Upload foto gagal." }, { status: 500 });
  }
}
