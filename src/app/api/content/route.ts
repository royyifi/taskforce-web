import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const KINDS = new Set(["ANNOUNCEMENT", "GUIDE", "TEMPLATE"]);

function view(content: { id:string; kind:string; title:string; summary:string|null; body:string|null; fileUrl:string|null; fileName:string|null; mimeType:string|null; published:boolean; publishedAt:Date|null; createdAt:Date; updatedAt:Date }) {
  return { ...content, publishedAt: content.publishedAt?.toISOString() || null, createdAt: content.createdAt.toISOString(), updatedAt: content.updatedAt.toISOString() };
}

export async function GET() {
  const session = await requireAdmin();
  const contents = await db.portalContent.findMany({
    where: session ? undefined : { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ contents: contents.map(view) });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola konten." }, { status: 401 });
  try {
    const body = await request.json();
    const { kind, title, summary, contentBody, fileUrl, fileName, mimeType, published } = body;
    if (!KINDS.has(String(kind))) return NextResponse.json({ error: "Jenis konten tidak valid." }, { status: 400 });
    if (!title || !String(title).trim()) return NextResponse.json({ error: "Judul wajib diisi." }, { status: 400 });
    if ((kind === "GUIDE" || kind === "TEMPLATE") && !fileUrl) return NextResponse.json({ error: "File wajib diunggah untuk panduan atau template." }, { status: 400 });
    const isPublished = Boolean(published);
    const content = await db.portalContent.create({ data: { kind: String(kind), title: String(title).trim(), summary: summary ? String(summary).trim() : null, body: contentBody ? String(contentBody).trim() : null, fileUrl: fileUrl || null, fileName: fileName || null, mimeType: mimeType || null, published: isPublished, publishedAt: isPublished ? new Date() : null } });
    await logAudit({ action: "CREATE", entityType: "PortalContent", entityId: content.id, entityName: content.title, detail: `Membuat konten ${content.kind}${isPublished ? " dan menerbitkannya" : " sebagai draft"}.` });
    return NextResponse.json({ ok: true, content: view(content) }, { status: 201 });
  } catch (error) {
    console.error("content POST error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
