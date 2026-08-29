import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const members = await db.teamMember.findMany({ orderBy: [{ isKetua: "desc" }, { order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola tim." }, { status: 401 });

  try {
    const body = await request.json();
    const { name, isKetua, phone, email, photoUrl, order } = body;
    if (!name || !String(name).trim()) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });

    // Pastikan hanya ada satu ketua
    if (isKetua) await db.teamMember.updateMany({ data: { isKetua: false } });

    const member = await db.teamMember.create({
      data: { name: String(name).trim(), isKetua: !!isKetua, phone: phone || null, email: email || null, photoUrl: photoUrl || null, order: Number(order) || 0 },
    });
    await logAudit({ action: "CREATE", entityType: "TeamMember", entityId: member.id, entityName: member.name, detail: `Menambah anggota tim: ${member.name}` });
    return NextResponse.json({ ok: true, member }, { status: 201 });
  } catch (err) {
    console.error("team POST error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
