import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_FIELDS = { id: true, name: true, email: true, role: true, unit: true, status: true, createdAt: true } as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Hanya Super Admin yang dapat mengelola akun." }, { status: 403 });
  const { id } = await params;
  if (id === session.id) return NextResponse.json({ error: "Kelola akun sendiri melalui menu ubah password." }, { status: 400 });

  try {
    const body = await request.json();
    const { name, email, unit, status, password } = body;
    const target = await db.user.findUnique({ where: { id } });
    if (!target || target.role !== "TEAM_ADMIN") return NextResponse.json({ error: "Akun admin tim tidak ditemukan." }, { status: 404 });
    if (email !== undefined && !EMAIL_RE.test(String(email).trim())) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    if (password !== undefined && String(password).length < 6) return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });

    const data = {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(email !== undefined && { email: String(email).trim().toLowerCase() }),
      ...(unit !== undefined && { unit: unit?.trim() || null }),
      ...(status !== undefined && { status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" }),
      ...(password !== undefined && { passwordHash: await hashPassword(String(password)) }),
    };
    const user = await db.user.update({ where: { id }, data, select: PUBLIC_FIELDS });
    await logAudit({ action: "UPDATE", entityType: "User", entityId: id, entityName: user.name, detail: `Super Admin mengubah akun admin tim: ${user.email}` });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("users PATCH error:", err);
    return NextResponse.json({ error: "Email mungkin sudah digunakan atau terjadi kesalahan." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus akun." }, { status: 403 });
  const { id } = await params;
  if (id === session.id) return NextResponse.json({ error: "Akun sendiri tidak dapat dihapus." }, { status: 400 });
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role !== "TEAM_ADMIN") return NextResponse.json({ error: "Akun admin tim tidak ditemukan." }, { status: 404 });
  await db.user.delete({ where: { id } });
  await logAudit({ action: "DELETE", entityType: "User", entityId: id, entityName: target.name, detail: `Super Admin menghapus akun admin tim: ${target.email}` });
  return NextResponse.json({ ok: true });
}
