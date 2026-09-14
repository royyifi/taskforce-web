import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const KINDS = new Set(["ANNOUNCEMENT", "GUIDE", "TEMPLATE"]);

type Content = Awaited<ReturnType<typeof db.portalContent.findUnique>>;
function view(content: NonNullable<Content>) {
  return { ...content, publishedAt: content.publishedAt?.toISOString() || null, createdAt: content.createdAt.toISOString(), updatedAt: content.updatedAt.toISOString() };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola konten." }, { status: 401 });
  const { id } = await params;
  try {
    const existing = await db.portalContent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.kind !== undefined) {
      if (!KINDS.has(String(body.kind))) return NextResponse.json({ error: "Jenis konten tidak valid." }, { status: 400 });
      data.kind = String(body.kind);
    }
    if (body.title !== undefined) {
      if (!String(body.title).trim()) return NextResponse.json({ error: "Judul wajib diisi." }, { status: 400 });
      data.title = String(body.title).trim();
    }
    for (const key of ["summary", "contentBody", "fileUrl", "fileName", "mimeType"]) if (body[key] !== undefined) data[key === "contentBody" ? "body" : key] = body[key] ? String(body[key]) : null;
    if (body.published !== undefined) {
      data.published = Boolean(body.published);
      data.publishedAt = body.published ? (existing.publishedAt || new Date()) : null;
    }
    const content = await db.portalContent.update({ where: { id }, data: data as never });
    await logAudit({ action: "UPDATE", entityType: "PortalContent", entityId: id, entityName: content.title, detail: `Memperbarui konten ${content.kind}.` });
    return NextResponse.json({ ok: true, content: view(content) });
  } catch (error) {
    console.error("content PATCH error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola konten." }, { status: 401 });
  const { id } = await params;
  const existing = await db.portalContent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
  await db.portalContent.delete({ where: { id } });
  await logAudit({ action: "DELETE", entityType: "PortalContent", entityId: id, entityName: existing.title, detail: `Menghapus konten ${existing.kind}.` });
  return NextResponse.json({ ok: true });
}
