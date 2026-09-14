import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { putStoredFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengunggah logo mitra." }, { status: 401 });
  const { id } = await params;
  const partner = await db.partner.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File wajib dipilih." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format harus JPG, PNG, atau WEBP." }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    if (data.length > MAX_SIZE) return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
    if (!validSignature(file.type, data)) return NextResponse.json({ error: "File tidak valid." }, { status: 400 });
    const fileId = `logo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await putStoredFile({ id: fileId, data, mimeType: file.type });
    await db.partner.update({ where: { id }, data: { logoFileId: fileId } });
    await logAudit({ action: "UPDATE", entityType: "Partner", entityId: id, entityName: partner.name, detail: `Logo mitra diperbarui oleh ${session.name}` });
    return NextResponse.json({ ok: true, logoFileId: fileId });
  } catch (error) {
    console.error("partner logo upload error:", error);
    return NextResponse.json({ error: "Upload logo gagal." }, { status: 500 });
  }
}
