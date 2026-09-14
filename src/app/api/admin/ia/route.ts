import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

function activityData(a: any) {
  return {
    id: a.id, activityCode: a.activityCode, title: a.title, type: a.type,
    partnerName: a.partner.name, submittedBy: a.submittedBy, submitterUnit: a.submitterUnit,
    dateStart: a.dateStart?.toISOString() || null, dateEnd: a.dateEnd?.toISOString() || null,
    students: a.students.map((s: any) => s.name), iaNumber: a.iaNumber, iaUrl: a.iaUrl,
    iaConfirmedAt: a.iaConfirmedAt?.toISOString() || null, reportDate: a.reportDate?.toISOString() || null,
    reportSummary: a.reportSummary, reportLink: a.reportLink, photoUrl: a.photoUrl || null,
    iaStatus: a.iaStatus, iaFirstParty: a.iaFirstParty, iaProgramName: a.iaProgramName,
    iaPartnerName: a.iaPartnerName, iaPartnerPicName: a.iaPartnerPicName, iaPartnerPicPosition: a.iaPartnerPicPosition,
    iaPartnerAddress: a.iaPartnerAddress, iaReviewNote: a.iaReviewNote, hasLogo: Boolean(a.iaPartnerLogoFileId), spmUrl: a.spmUrl,
    iaLanguage: a.iaLanguage || "ID",
    source: a.source || null,
  };
}

export async function GET() {
  if (!await requireAdmin()) return unauthorized();
  const include = { partner: { select: { name: true } }, students: { orderBy: { order: "asc" as const } } };
  const [submitted, issued, completion] = await Promise.all([
    db.activity.findMany({ where: { status: "APPROVED", iaStatus: { in: ["DIAJUKAN", "REVISI"] }, completedAt: null }, include, orderBy: { iaSubmittedAt: "asc" } }),    db.activity.findMany({ where: { status: "APPROVED", iaStatus: { in: ["DISETUJUI", "DITANDATANGANI"] }, iaConfirmedAt: null, completedAt: null, NOT: { source: "IA_DIRECT" } }, include, orderBy: { updatedAt: "desc" } }),
    db.activity.findMany({ where: { status: "APPROVED", completedAt: null, OR: [{ reportDate: { not: null } }, { source: "IA_DIRECT", iaNumber: { not: null } }] }, include, orderBy: { updatedAt: "desc" } }),
  ]);
  return NextResponse.json({ waiting: submitted.map(activityData), issued: issued.map(activityData), completion: completion.map(a => ({ ...activityData(a), hasReport: Boolean(a.reportDate && a.reportSummary), hasDocs: Boolean(a.reportLink || a.photoUrl), hasIa: Boolean(a.iaNumber), photoUrl: a.photoUrl || null })) });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const body = await request.json();
  const activityId = typeof body.activityId === "string" ? body.activityId : "";
  const reportLink = typeof body.reportLink === "string" ? body.reportLink.trim() : "";
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : "";
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.status !== "APPROVED") return NextResponse.json({ error: "Kegiatan tidak ditemukan atau belum disetujui." }, { status: 404 });
  if (activity.completedAt) return NextResponse.json({ error: "Kegiatan sudah ditandai selesai." }, { status: 400 });
  const updates = { ...(reportLink ? { reportLink } : {}), ...(photoUrl ? { photoUrl } : {}) };
  const current = { ...activity, ...updates };
  const missing = [
    activity.source === "IA_DIRECT" ? "" : (!current.reportDate || !current.reportSummary ? "Laporan (Tim MBKM)" : ""),
    !current.reportLink && !current.photoUrl ? "Dokumentasi (link Drive atau foto sampul)" : "",
    !current.iaNumber ? "IA (Tim Kerja Sama)" : "",
  ].filter(Boolean);
  if (missing.length) return NextResponse.json({ error: `Checklist belum lengkap: ${missing.join(", ")}.` }, { status: 400 });
  await db.activity.update({ where: { id: activityId }, data: { ...updates, completedAt: new Date(), iaStatus: "DITANDATANGANI" } });
  await logAudit({ action: "UPDATE", entityType: "Activity", entityId: activityId, entityName: activity.title, detail: `Kegiatan ditandai selesai oleh ${session.name}` });
  return NextResponse.json({ ok: true });
}
