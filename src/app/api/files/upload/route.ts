import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { putStoredFile, r2Enabled } from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "application/pdf") return bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === "%PDF";
  if (type === "application/msword" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b || bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf;
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Login diperlukan untuk mengunggah." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File wajib dipilih." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format harus JPG, PNG, WEBP, PDF, DOC, atau DOCX." }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    if (data.length > MAX_SIZE) return NextResponse.json({ error: "Ukuran file maksimal 10 MB." }, { status: 400 });
    if (!validSignature(file.type, data)) return NextResponse.json({ error: "File tidak valid." }, { status: 400 });
    const id = `file_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const { url } = await putStoredFile({ id, data, mimeType: file.type });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("file upload error:", error);
    return NextResponse.json({ error: "Upload foto gagal." }, { status: 500 });
  }
}
