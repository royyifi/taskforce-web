import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function cleanParticipants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === "object" && item !== null ? item as { name?: unknown; role?: unknown } : { name: item }).filter(item => typeof item.name === "string" && item.name.trim()).map((item, order) => ({ name: String(item.name).trim(), order }));
}

function cleanLecturers(value: unknown) {
  if (!Array.isArray(value)) return [] as { name: string; order: number }[];
  return [...new Set(value.map(item => typeof item === "object" && item !== null ? String((item as { name?: unknown }).name || "").trim() : String(item || "").trim()).filter(Boolean))].map((name, order) => ({ name, order }));
}

async function generateActivityCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const prefix = `MAG-${year}-`;
  const last = await db.activity.findFirst({ where: { activityCode: { startsWith: prefix } }, orderBy: { activityCode: "desc" } });
  let seq = 1;
  if (last?.activityCode) {
    const lastNum = parseInt(last.activityCode.split("-").pop() || "0", 10);
    seq = lastNum + 1;
  }
  return `${prefix}${seq.toString().padStart(3, "0")}`;
}

export async function GET() {
  const submissions = await db.activity.findMany({ where: { status: "PENDING" }, include: { partner: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ submissions: submissions.map(s => ({ id: s.id, activityCode: s.activityCode, title: s.title, type: s.type, partnerName: s.partner.name, partnerSlug: s.partner.slug, submittedBy: s.submittedBy, dateStart: s.dateStart?.toISOString() || null, status: s.status, createdAt: s.createdAt.toISOString() })) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { partnerId, activityType, title, description, goal, dateStart, dateEnd, location, participantCount, dosenName, lecturers, partnerPIC, partnerPICPosition, partnerPICPhone, partnerPICEmail, submitterName, submitterEmail, submitterNim, submitterPhone, prodi, submitterUnit, participants, rkpUrl, spmUrl, logoFileId } = body;
  if (!partnerId || !title || !activityType || !dateStart || !dateEnd || !submitterName || !submitterNim || !prodi) return NextResponse.json({ error: "Mitra, judul, jenis, periode, dan identitas mahasiswa wajib diisi." }, { status: 400 });
  if (!logoFileId) return NextResponse.json({ error: "Logo mitra wajib diunggah." }, { status: 400 });
  if (activityType === "MAGANG" && !rkpUrl) return NextResponse.json({ error: "Dokumen RKP wajib diunggah untuk kegiatan magang." }, { status: 400 });
  const partner = await db.partner.findUnique({ where: { id: partnerId, status: "APPROVED" } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

  const logo = await db.storedFile.findUnique({ where: { id: String(logoFileId) } });
  if (!logo || !logo.mimeType.startsWith("image/")) return NextResponse.json({ error: "Logo mitra tidak valid." }, { status: 400 });

  const activityCode = await generateActivityCode();
  const studentRows = cleanParticipants(participants);
  const lecturerRows = cleanLecturers(lecturers || (dosenName ? [dosenName] : []));

  const activity = await db.activity.create({ data: {
    activityCode, partnerId, title: String(title).trim(), type: String(activityType), dateStart: new Date(dateStart), dateEnd: new Date(dateEnd), location: location || null, description: description || null, goal: goal || null,
    participants: Number(participantCount) || studentRows.length || null, partnerPic: partnerPIC || null, partnerPICPosition: partnerPICPosition || null, partnerPICPhone: partnerPICPhone || null, partnerPICEmail: partnerPICEmail || null,
    dosenName: lecturerRows[0]?.name || null, rkpStatus: rkpUrl ? "DIAJUKAN" : "BELUM_ADA", rkpUrl: rkpUrl || null, spmUrl: spmUrl || null, iaPartnerLogoFileId: String(logoFileId), submitterNim, submitterPhone: submitterPhone || null, submitterUnit: prodi || submitterUnit || null,
    submittedBy: String(submitterName).trim(), submittedEmail: submitterEmail || null, status: "PENDING",
    students: { create: studentRows },
    lecturers: { create: lecturerRows },
  } });
  await logAudit({ action: "CREATE", entityType: "Activity", entityId: activity.id, entityName: activity.title, detail: `Pengajuan kegiatan ${activityCode} (${activity.type}) dari ${submitterName}` });
  return NextResponse.json({ ok: true, id: activity.id, activityCode, message: "Pengajuan berhasil dikirim dan menunggu pemeriksaan Tim Kerja Sama." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewNote } = body;
  if (!id || !status) return NextResponse.json({ error: "id dan status wajib." }, { status: 400 });
  if (!["APPROVED", "REJECTED", "REVISION_REQUESTED"].includes(status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  const submission = await db.activity.findUnique({ where: { id }, include: { partner: true } });
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  await db.activity.update({ where: { id }, data: { status, reviewNote: reviewNote || null, reviewedAt: new Date(), ...(status === "APPROVED" ? { iaStatus: "DIAJUKAN", iaSubmittedAt: new Date(), iaReviewNote: null } : {}) } });
  await logAudit({ action: status === "APPROVED" ? "APPROVE" : "REJECT", entityType: "Activity", entityId: id, entityName: submission.title, detail: `Kegiatan ${submission.activityCode || submission.title} (${submission.partner.name}): ${status}. ${reviewNote || ""}` });
  return NextResponse.json({ ok: true });
}
