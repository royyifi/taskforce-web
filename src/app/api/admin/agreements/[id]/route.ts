import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola perjanjian." }, { status: 401 });
  const { id } = await params;
  const existing = await db.agreement.findUnique({ where: { id }, include: { partner: { select: { name: true } } } });
  if (!existing) return NextResponse.json({ error: "Perjanjian tidak ditemukan." }, { status: 404 });

  try {
    const body = await request.json();
    const { number, inputDate, startDate, endDate, notes } = body;
    const createdAt = parseDate(inputDate);
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (createdAt === undefined || start === undefined || end === undefined) return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    if (start && end && end < start) return NextResponse.json({ error: "Tanggal berakhir tidak boleh sebelum tanggal mulai." }, { status: 400 });

    const agreement = await db.agreement.update({ where: { id }, data: { number: number?.trim() || null, createdAt: createdAt || new Date(), startDate: start, endDate: end, notes: notes?.trim() || null } });
    await logAudit({ action: "UPDATE", entityType: "Agreement", entityId: id, entityName: existing.partner.name, detail: `Memperbarui perjanjian ${agreement.number || "tanpa nomor"} oleh ${session.name}` });
    return NextResponse.json({ ok: true, agreement });
  } catch (error) {
    console.error("agreements PATCH error:", error);
    return NextResponse.json({ error: "Data perjanjian gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola perjanjian." }, { status: 401 });
  const { id } = await params;
  const existing = await db.agreement.findUnique({ where: { id }, include: { partner: { select: { name: true } } } });
  if (!existing) return NextResponse.json({ error: "Perjanjian tidak ditemukan." }, { status: 404 });
  await db.agreement.delete({ where: { id } });
  await logAudit({ action: "DELETE", entityType: "Agreement", entityId: id, entityName: existing.partner.name, detail: `Menghapus perjanjian ${existing.number || "tanpa nomor"} oleh ${session.name}` });
  return NextResponse.json({ ok: true });
}
