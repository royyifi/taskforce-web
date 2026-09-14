import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EDITABLE_FIELDS = ["name", "level", "category", "address", "phone", "email", "website", "picName", "picPosition", "picPhone", "picEmail", "city", "country", "description"];

type SubmitterInfo = { submitterName?: string; submitterEmail?: string; submitterUnit?: string; reason?: string };
function parseSubmitterInfo(value: string | null): SubmitterInfo {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as SubmitterInfo : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [totalPartners, pendingPartners, pendingActivities, totalActivities, activePartnerIds, recentActivityPartnerIds, agreementsEndingSoon, partnersWithoutPic, pendingEdits, approvedPartnersList] = await Promise.all([
    db.partner.count({ where: { status: "APPROVED" } }),
    db.partner.count({ where: { status: "PENDING" } }),
    db.activity.count({ where: { status: "PENDING" } }),
    db.activity.count({ where: { status: "APPROVED" } }),
    db.agreement.findMany({ where: { endDate: { gte: now } }, select: { partnerId: true }, distinct: ["partnerId"] }),
    db.activity.findMany({ where: { status: "APPROVED", dateStart: { gte: sixMonthsAgo } }, select: { partnerId: true }, distinct: ["partnerId"] }),
    db.agreement.findMany({ where: { endDate: { gte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) } }, select: { partnerId: true, endDate: true } }),
    db.partner.count({ where: { status: "APPROVED", picName: null } }),
    db.partnerEditProposal.findMany({ where: { status: "PENDING" }, include: { partner: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.partner.findMany({
      where: { status: "APPROVED" },
      include: {
        cooperationFields: { include: { cooperationField: { select: { code: true, name: true } } } },
        agreements: { select: { id: true, endDate: true } },
        activities: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const usedIds = new Set(activePartnerIds.map(a => a.partnerId));
  const recentIds = new Set(recentActivityPartnerIds.map(a => a.partnerId));
  const partnersUsed = [...recentIds].filter(id => usedIds.has(id)).length;
  const partnersUnused = [...usedIds].filter(id => !recentIds.has(id)).length;

  const pendingSubmissions = await db.partner.findMany({
    where: { status: "PENDING" },
    include: { cooperationFields: { include: { cooperationField: { select: { code: true, name: true } } } } },
    orderBy: { createdAt: "desc" }, take: 10,
  });
  const allPending = await db.activity.findMany({
    where: { status: "PENDING" },
    include: { partner: { select: { name: true, slug: true } }, lecturers: { orderBy: { order: "asc" as const } }, students: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  const pendingSubmissionsList = allPending.filter(a => a.activityCode != null);
  const pendingActivitiesList = allPending.filter(a => a.activityCode == null);

  // Completion: approved activities needing admin action (report + docs + IA checklist)
  const completionRaw = await db.activity.findMany({
    where: {
      status: "APPROVED",
      completedAt: null,
      OR: [{ reportDate: { not: null } }, { source: "IA_DIRECT", iaNumber: { not: null } }],
    },
    include: { partner: { select: { name: true } }, students: { orderBy: { order: "asc" as const } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    kpi: { totalPartners, pendingPartners, pendingActivities, totalActivities, partnersUsed, partnersUnused, agreementsEndingSoon: agreementsEndingSoon.length, partnersWithoutPic },
    pendingPartners: pendingSubmissions.map(p => {
      const submitter = parseSubmitterInfo(p.internalNote);
      return {
        id: p.id, name: p.name, level: p.level, category: p.category, createdAt: p.createdAt.toISOString(),
        country: p.country, city: p.city, address: p.address, website: p.website, phone: p.phone, email: p.email,
        picName: p.picName, picPosition: p.picPosition, picPhone: p.picPhone, picEmail: p.picEmail,
        cooperationFields: p.cooperationFields.map(({ cooperationField }) => ({ code: cooperationField.code, name: cooperationField.name })),
        submitterName: submitter.submitterName || null, submitterEmail: submitter.submitterEmail || null,
        submitterUnit: submitter.submitterUnit || null, reason: submitter.reason || null,
      };
    }),
    pendingSubmissions: pendingSubmissionsList.map(a => ({
      id: a.id, activityCode: a.activityCode, title: a.title, type: a.type, dateStart: a.dateStart?.toISOString() || null, dateEnd: a.dateEnd?.toISOString() || null, location: a.location, description: a.description, goal: a.goal,
      partnerName: a.partner.name, partnerSlug: a.partner.slug,
      submittedBy: a.submittedBy, submittedEmail: a.submittedEmail, submitterNim: a.submitterNim, submitterPhone: a.submitterPhone, submitterUnit: a.submitterUnit,
      dosenName: a.dosenName, lecturers: a.lecturers.map(l => l.name),
      partnerPic: a.partnerPic, partnerPICPosition: a.partnerPICPosition, partnerPICPhone: a.partnerPICPhone, partnerPICEmail: a.partnerPICEmail,
      rkpStatus: a.rkpStatus, rkpUrl: a.rkpUrl, spmUrl: a.spmUrl, hasLogo: Boolean(a.iaPartnerLogoFileId), students: a.students.map(s => s.name), createdAt: a.createdAt.toISOString(),
    })),
    pendingActivitiesList: pendingActivitiesList.map(a => ({
      id: a.id, title: a.title, type: a.type, partnerName: a.partner.name, submittedBy: a.submittedBy, submittedEmail: a.submittedEmail,
      submitterNim: a.submitterNim, submitterPhone: a.submitterPhone, submitterUnit: a.submitterUnit,
      dateStart: a.dateStart?.toISOString() || null, dateEnd: a.dateEnd?.toISOString() || null,
      location: a.location, description: a.description, goal: a.goal, output: a.output,
      unit: a.unit, participants: a.participants,
      partnerPic: a.partnerPic, partnerPICPosition: a.partnerPICPosition, partnerPICPhone: a.partnerPICPhone, partnerPICEmail: a.partnerPICEmail,
      dosenName: a.dosenName, lecturers: a.lecturers.map(l => l.name),
      rkpUrl: a.rkpUrl, spmUrl: a.spmUrl,
      students: a.students.map(s => s.name), createdAt: a.createdAt.toISOString(),
    })),
    completionActivities: completionRaw.map(a => ({
      id: a.id, activityCode: a.activityCode, title: a.title,
      partnerName: a.partner.name, submittedBy: a.submittedBy, submitterUnit: a.submitterUnit,
      dateStart: a.dateStart?.toISOString() || null, dateEnd: a.dateEnd?.toISOString() || null,
      students: a.students.map(s => s.name), source: a.source || null,
      iaNumber: a.iaNumber, iaUrl: a.iaUrl, reportLink: a.reportLink, photoUrl: a.photoUrl,
      hasReport: Boolean(a.reportDate && a.reportSummary),
      hasDocs: Boolean(a.reportLink),
      hasIa: Boolean(a.iaNumber),
    })),
    pendingEdits: pendingEdits.map(e => {
      const record = e as unknown as Record<string, unknown>;
      return {
        id: e.id, partnerId: e.partnerId, partnerName: e.partner.name, submitterName: e.submitterName, submitterEmail: e.submitterEmail, note: e.note, createdAt: e.createdAt.toISOString(),
        changes: Object.fromEntries(EDITABLE_FIELDS.flatMap(k => {
          const value = record[k];
          return value !== null && value !== undefined ? [[k, String(value)]] : [];
        })),
        proposedFields: e.proposedFields || null,
      };
    }),
    approvedPartners: approvedPartnersList.map(p => ({
      id: p.id,
      name: p.name,
      level: p.level,
      category: p.category,
      createdAt: p.createdAt.toISOString(),
      country: p.country,
      city: p.city,
      address: p.address,
      website: p.website,
      phone: p.phone,
      email: p.email,
      picName: p.picName,
      cooperationFields: p.cooperationFields.map(({ cooperationField }) => ({ code: cooperationField.code, name: cooperationField.name })),
      agreementCount: p.agreements.length,
      activityCount: p.activities.length,
    })),
  });
}
