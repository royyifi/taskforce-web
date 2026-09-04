import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function cleanNames(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return [...new Set(value.map(item => typeof item === "string" ? item.trim() : "").filter(Boolean))];
}

export async function GET() {
  const activities = await db.activity.findMany({
    where: { status: "APPROVED" },
    include: {
      partner: { select: { name: true, slug: true, level: true } },
      lecturers: { orderBy: { order: "asc" } },
      students: { orderBy: { order: "asc" } },
    },
    orderBy: { dateStart: "desc" },
  });
  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { partnerId, title, type, dateStart, dateEnd, location, description, goal, output, internalPic, partnerPic, partnerPICPosition, partnerPICPhone, partnerPICEmail, unit, participants, photoUrl, driveUrl, publicationUrl, submittedBy, submittedEmail, submitterNim, submitterPhone, submitterUnit, dosenName, rkpStatus, rkpUrl } = body;
  const lecturers = Array.isArray(body.lecturers)
    ? body.lecturers.map((item: unknown) => typeof item === "string" ? { name: item, isLeader: false } : item)
    : [];
  const lecturerNames = cleanNames(lecturers.map((item: { name?: unknown }) => item?.name));
  const studentNames = cleanNames(body.students);

  if (!partnerId || !title || !type || !dateStart || !submittedBy) return NextResponse.json({ error: "Mitra, judul, jenis, tanggal, dan nama pengusul wajib diisi." }, { status: 400 });
  if (Array.isArray(body.lecturers) && lecturers.length !== lecturerNames.length) return NextResponse.json({ error: "Nama dosen tidak boleh kosong atau duplikat." }, { status: 400 });
  if (lecturers.filter((item: { isLeader?: unknown }) => Boolean(item?.isLeader)).length > 1) return NextResponse.json({ error: "Hanya satu dosen yang dapat menjadi ketua pelaksana." }, { status: 400 });
  const partner = await db.partner.findUnique({ where: { id: partnerId, status: "APPROVED" } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

  const activity = await db.activity.create({
    data: {
      partnerId, title, type, dateStart: new Date(dateStart), dateEnd: dateEnd ? new Date(dateEnd) : null,
      location: location || null, description: description || null, goal: goal || null, output: output || null,
      internalPic: internalPic || null, partnerPic: partnerPic || null, partnerPICPosition: partnerPICPosition || null,
      partnerPICPhone: partnerPICPhone || null, partnerPICEmail: partnerPICEmail || null, unit: unit || null,
      participants: participants ? Number(participants) : null, photoUrl: photoUrl || null,
      driveUrl: driveUrl || null, publicationUrl: publicationUrl || null, submittedBy, submittedEmail: submittedEmail || null,
      submitterNim: submitterNim || null, submitterPhone: submitterPhone || null, submitterUnit: submitterUnit || null,
      dosenName: dosenName || null, rkpStatus: rkpStatus || "BELUM_ADA", rkpUrl: rkpUrl || null,
      status: "PENDING",
      lecturers: { create: lecturerNames.map((name, order) => ({ name, order, isLeader: Boolean(lecturers.find((item: { name?: unknown; isLeader?: unknown }) => String(item?.name || "").trim() === name)?.isLeader) })) },
      students: { create: studentNames.map((name, order) => ({ name, order })) },
    },
  });
  await logAudit({ action: "CREATE", entityType: "Activity", entityId: activity.id, entityName: activity.title, detail: `Usulan kegiatan dari ${submittedBy}` });
  return NextResponse.json({ ok: true, message: "Laporan kegiatan berhasil dikirim dan menunggu verifikasi admin." }, { status: 201 });
}
