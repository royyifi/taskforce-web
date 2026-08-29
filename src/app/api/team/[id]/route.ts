import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

async function removePhoto(photoUrl: string | null | undefined) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/team/")) return;
  try { await unlink(path.join(process.cwd(), "public", photoUrl)); } catch { /* file sudah tidak ada */ }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola tim." }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isKetua, phone, email, photoUrl, order } = body;
    if (name !== undefined && !String(name).trim()) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });

    // Pastikan hanya ada satu ketua
    if (isKetua) {
      await db.teamMember.updateMany({ where: { isKetua: true, id: { not: id } }, data: { isKetua: false } });
    }

    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(isKetua !== undefined && { isKetua: !!isKetua }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(order !== undefined && { order: Number(order) || 0 }),
      },
    });
    await logAudit({ action: "UPDATE", entityType: "TeamMember", entityId: id, entityName: member.name, detail: `Mengubah data anggota tim: ${member.name}` });
    return NextResponse.json({ ok: true, member });
  } catch (err) {
    console.error("team PATCH error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola tim." }, { status: 401 });

  try {
    const { id } = await params;
    const member = await db.teamMember.findUnique({ where: { id } });
    if (!member) return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
    await removePhoto(member.photoUrl);
    await db.teamMember.delete({ where: { id } });
    await logAudit({ action: "DELETE", entityType: "TeamMember", entityId: id, entityName: member.name, detail: `Menghapus anggota tim: ${member.name}` });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("team DELETE error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
