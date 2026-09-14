import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function cleanParticipants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => typeof item === "object" && item !== null ? item as { name?: unknown } : { name: item })
    .filter(item => typeof item.name === "string" && item.name.trim())
    .map((item, order) => ({ name: String(item.name).trim(), order }));
}

function cleanLecturers(value: unknown) {
  if (!Array.isArray(value)) return [] as { name: string; order: number }[];
  return [...new Set(value.map(item => typeof item === "object" && item !== null ? String((item as { name?: unknown }).name || "").trim() : String(item || "").trim()).filter(Boolean))].map((name, order) => ({ name, order }));
}

function responseError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await db.activity.findUnique({
    where: { id },
    include: { partner: true, students: { orderBy: { order: "asc" } }, lecturers: { orderBy: { order: "asc" } } },
  });
  if (!activity || activity.status !== "REVISION_REQUESTED") return responseError("Pengajuan tidak dapat diperbaiki.", 404);

  return NextResponse.json({
    id: activity.id,
    partnerId: activity.partnerId,
    partner: {
      id: activity.partner.id, name: activity.partner.name, slug: activity.partner.slug, level: activity.partner.level,
      picName: activity.partner.picName, picPosition: activity.partner.picPosition, picPhone: activity.partner.picPhone, picEmail: activity.partner.picEmail,
    },
    activityType: activity.type, title: activity.title, description: activity.description, goal: activity.goal,
    dateStart: activity.dateStart?.toISOString().slice(0, 10) || "", dateEnd: activity.dateEnd?.toISOString().slice(0, 10) || "",
    location: activity.location, participantCount: activity.participants,
    dosenName: activity.dosenName, partnerPic: activity.partnerPic, partnerPICPosition: activity.partnerPICPosition,
    partnerPICPhone: activity.partnerPICPhone, partnerPICEmail: activity.partnerPICEmail,
    rkpUrl: activity.rkpUrl, spmUrl: activity.spmUrl, logoFileId: activity.iaPartnerLogoFileId, submittedBy: activity.submittedBy, submittedEmail: activity.submittedEmail,
    submitterNim: activity.submitterNim, submitterPhone: activity.submitterPhone, submitterUnit: activity.submitterUnit,
    students: activity.students.map(student => student.name),
    lecturers: activity.lecturers.map(lecturer => lecturer.name),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { partnerId, activityType, title, description, goal, dateStart, dateEnd, location, participantCount, dosenName, lecturers, partnerPIC, partnerPICPosition, partnerPICPhone, partnerPICEmail, submitterName, submitterEmail, submitterNim, submitterPhone, prodi, submitterUnit, participants, rkpUrl, spmUrl, logoFileId } = body;
  if (!partnerId || !title || !activityType || !dateStart || !dateEnd || !submitterName || !submitterNim || !prodi) return responseError("Mitra, judul, jenis, periode, dan identitas mahasiswa wajib diisi.", 400);
  if (activityType === "MAGANG" && !rkpUrl) return responseError("Dokumen RKP wajib diunggah untuk kegiatan magang.", 400);

  const activity = await db.activity.findUnique({ where: { id }, include: { partner: true } });
  if (!activity || activity.status !== "REVISION_REQUESTED") return responseError("Pengajuan tidak dapat diperbaiki.", 404);
  const partner = await db.partner.findUnique({ where: { id: partnerId, status: "APPROVED" } });
  if (!partner) return responseError("Mitra tidak ditemukan.", 404);
  const studentRows = cleanParticipants(participants);
  const lecturerRows = cleanLecturers(lecturers || (dosenName ? [dosenName] : []));

  await db.$transaction([
    db.activityStudent.deleteMany({ where: { activityId: id } }),
    db.activityLecturer.deleteMany({ where: { activityId: id } }),
    db.activity.update({
      where: { id },
      data: {
        partnerId, title: String(title).trim(), type: String(activityType), dateStart: new Date(dateStart), dateEnd: new Date(dateEnd),
        location: location || null, description: description || null, goal: goal || null, participants: Number(participantCount) || studentRows.length || null,
        partnerPic: partnerPIC || null, partnerPICPosition: partnerPICPosition || null, partnerPICPhone: partnerPICPhone || null, partnerPICEmail: partnerPICEmail || null,
        dosenName: lecturerRows[0]?.name || null, submitterNim: String(submitterNim).trim(), submitterPhone: submitterPhone || null, submitterUnit: prodi || submitterUnit || null,
        submittedBy: String(submitterName).trim(), submittedEmail: submitterEmail || null,
        ...(rkpUrl ? { rkpUrl, rkpStatus: "DIAJUKAN" } : {}),
        ...(spmUrl ? { spmUrl } : {}),
        ...(logoFileId ? { iaPartnerLogoFileId: String(logoFileId) } : {}),
        status: "PENDING", reviewNote: null, reviewedAt: null,
        students: { create: studentRows },
        lecturers: { create: lecturerRows },
      },
    }),
  ]);

  await logAudit({ action: "UPDATE", entityType: "Activity", entityId: id, entityName: String(title).trim(), detail: `Pengajuan diperbaiki dan dikirim ulang: ${activity.activityCode || title}` });
  return NextResponse.json({ ok: true, id, activityCode: activity.activityCode, message: "Perbaikan pengajuan berhasil dikirim dan menunggu pemeriksaan Tim Kerja Sama." });
}
