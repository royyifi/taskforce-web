import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Hanya Super Admin yang dapat melihat daftar akun." }, { status: 403 });

  const users = await db.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "TEAM_ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, unit: true, status: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Hanya Super Admin yang dapat menambah akun." }, { status: 403 });

  try {
    const body = await request.json();
    const { name, email, password, unit } = body;
    if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
    if (!EMAIL_RE.test(String(email).trim())) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });

    const normalized = String(email).trim().toLowerCase();
    const exists = await db.user.findUnique({ where: { email: normalized } });
    if (exists) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

    const passwordHash = await hashPassword(String(password));
    const user = await db.user.create({
      data: { name: String(name).trim(), email: normalized, passwordHash, role: "TEAM_ADMIN", unit: unit?.trim() || null, status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true, unit: true, status: true, createdAt: true },
    });
    await logAudit({ action: "CREATE", entityType: "User", entityId: user.id, entityName: user.name, detail: `Super Admin membuat akun admin tim: ${user.email}` });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    console.error("users POST error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
