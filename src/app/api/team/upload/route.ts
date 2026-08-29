import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengunggah foto." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File foto wajib dipilih." }, { status: 400 });
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: "Format harus JPG, PNG, atau WEBP." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ukuran foto maksimal 5 MB." }, { status: 400 });

    const filename = `${crypto.randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "team");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true, url: `/uploads/team/${filename}` });
  } catch (err) {
    console.error("team upload error:", err);
    return NextResponse.json({ error: "Upload foto gagal." }, { status: 500 });
  }
}
