import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("partnerId");
  if (!partnerId) return NextResponse.json({ error: "Partner ID wajib diisi." }, { status: 400 });
  const agreements = await db.agreement.findMany({ where: { partnerId }, orderBy: [{ createdAt: "desc" }, { startDate: "desc" }] });
  return NextResponse.json({ agreements });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat mengelola perjanjian." }, { status: 401 });

  try {
    const body = await request.json();
    const { partnerId, number, inputDate, startDate, endDate, notes } = body;
    if (!partnerId) return NextResponse.json({ error: "Mitra wajib dipilih." }, { status: 400 });
    const partner = await db.partner.findUnique({ where: { id: String(partnerId) } });
    if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

    const createdAt = parseDate(inputDate);
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (createdAt === undefined || start === undefined || end === undefined) return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    if (start && end && end < start) return NextResponse.json({ error: "Tanggal berakhir tidak boleh sebelum tanggal mulai." }, { status: 400 });

    const agreement = await db.agreement.create({
      data: { partnerId: String(partnerId), type: "PKS", number: number?.trim() || null, createdAt: createdAt || new Date(), startDate: start, endDate: end, notes: notes?.trim() || null },
    });
    await logAudit({ action: "CREATE", entityType: "Agreement", entityId: agreement.id, entityName: partner.name, detail: `Menambahkan perjanjian ${agreement.number || "tanpa nomor"} untuk mitra "${partner.name}" oleh ${session.name}` });
    return NextResponse.json({ ok: true, agreement }, { status: 201 });
  } catch (error) {
    console.error("agreements POST error:", error);
    return NextResponse.json({ error: "Data perjanjian gagal disimpan." }, { status: 500 });
  }
}
