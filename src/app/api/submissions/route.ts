import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function cleanParticipants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === "object" && item !== null ? item as { name?: unknown; role?: unknown } : { name: item }).filter(item => typeof item.name === "string" && item.name.trim()).map((item, order) => ({ name: String(item.name).trim(), order }));
}

export async function GET() {
  const submissions = await db.activity.findMany({ where: { status: "PENDING" }, include: { partner: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ submissions: submissions.map(s => ({ id: s.id, title: s.title, type: s.type, partnerName: s.partner.name, partnerSlug: s.partner.slug, submittedBy: s.submittedBy, dateStart: s.dateStart?.toISOString() || null, status: s.status, createdAt: s.createdAt.toISOString() })) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { partnerId, activityType, title, description, goal, dateStart, dateEnd, location, participantCount, dosenName, partnerPIC, partnerPICPosition, partnerPICPhone, partnerPICEmail, submitterName, submitterEmail, submitterNim, submitterPhone, prodi, submitterUnit, participants, rkpUrl } = body;
  if (!partnerId || !title || !activityType || !dateStart || !dateEnd || !submitterName || !submitterNim || !prodi) return NextResponse.json({ error: "Mitra, judul, jenis, periode, dan identitas mahasiswa wajib diisi." }, { status: 400 });
  const partner = await db.partner.findUnique({ where: { id: partnerId, status: "APPROVED" } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });
  const studentRows = cleanParticipants(participants);
  const activity = await db.activity.create({ data: {
    partnerId, title: String(title).trim(), type: String(activityType), dateStart: new Date(dateStart), dateEnd: new Date(dateEnd), location: location || null, description: description || null, goal: goal || null,
    participants: Number(participantCount) || studentRows.length || null, partnerPic: partnerPIC || null, partnerPICPosition: partnerPICPosition || null, partnerPICPhone: partnerPICPhone || null, partnerPICEmail: partnerPICEmail || null,
    dosenName: dosenName || null, rkpStatus: rkpUrl ? "DIAJUKAN" : "BELUM_ADA", rkpUrl: rkpUrl || null, submitterNim, submitterPhone: submitterPhone || null, submitterUnit: prodi || submitterUnit || null,
    submittedBy: String(submitterName).trim(), submittedEmail: submitterEmail || null, status: "PENDING",
    students: { create: studentRows },
  } });
  await logAudit({ action: "CREATE", entityType: "Activity", entityId: activity.id, entityName: activity.title, detail: `Pengajuan kegiatan ${activity.type} dari ${submitterName}` });
  return NextResponse.json({ ok: true, id: activity.id, message: "Pengajuan berhasil dikirim dan menunggu pemeriksaan Tim Kerja Sama." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewNote } = body;
  if (!id || !status) return NextResponse.json({ error: "id dan status wajib." }, { status: 400 });
  if (!["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  const submission = await db.activity.findUnique({ where: { id }, include: { partner: true } });
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  await db.activity.update({ where: { id }, data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() } });
  await logAudit({ action: status === "APPROVED" ? "APPROVE" : "REJECT", entityType: "Activity", entityId: id, entityName: submission.title, detail: `Kegiatan "${submission.title}" untuk mitra ${submission.partner.name}: ${status}. ${reviewNote || ""}` });
  return NextResponse.json({ ok: true });
}
