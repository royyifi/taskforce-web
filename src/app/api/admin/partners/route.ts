import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const partners = await db.partner.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true, level: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ partners });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, level, category, country, city, address, phone, email, website, picName, picPosition, picPhone, picEmail, fields, submitterName, submitterEmail, submitterUnit, reason } = body;
  if (!name || !level || !category || !submitterName) return NextResponse.json({ error: "Nama mitra, level, kategori, dan nama pengusul wajib diisi." }, { status: 400 });
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
  const partner = await db.partner.create({ data: { name, slug, level, category, country: country || null, city: city || null, address: address || null, phone: phone || null, email: email || null, website: website || null, picName: picName || null, picPosition: picPosition || null, picPhone: picPhone || null, picEmail: picEmail || null, status: "PENDING", source: "Usulan publik", internalNote: JSON.stringify({ submitterName, submitterEmail, submitterUnit, reason }) } });
  await logAudit({ action: "CREATE", entityType: "Partner", entityId: partner.id, entityName: partner.name, detail: `Usulan mitra dari ${submitterName}` });
  return NextResponse.json({ ok: true, message: "Usulan mitra berhasil dikirim dan menunggu verifikasi admin." }, { status: 201 });
}
