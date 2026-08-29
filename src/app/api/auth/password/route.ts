import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Password lama dan password baru wajib diisi." }, { status: 400 });
    if (String(newPassword).length < 6) return NextResponse.json({ error: "Password baru minimal 6 karakter." }, { status: 400 });
    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user || !(await verifyPassword(String(currentPassword), user.passwordHash))) return NextResponse.json({ error: "Password lama salah." }, { status: 400 });
    const passwordHash = await hashPassword(String(newPassword));
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    await logAudit({ action: "UPDATE", entityType: "User", entityId: user.id, entityName: user.name, detail: "Pengguna mengubah password sendiri" });
    return NextResponse.json({ ok: true, message: "Password berhasil diubah." });
  } catch (err) {
    console.error("password PATCH error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
