import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EDITABLE_FIELDS = ["name", "level", "category", "address", "phone", "email", "website", "picName", "picPosition", "picPhone", "picEmail", "city", "country", "description"];

export async function GET() {
  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [totalPartners, pendingPartners, pendingActivities, totalActivities, activePartnerIds, recentActivityPartnerIds, agreementsEndingSoon, partnersWithoutPic, pendingEdits] = await Promise.all([
    db.partner.count({ where: { status: "APPROVED" } }),
    db.partner.count({ where: { status: "PENDING" } }),
    db.activity.count({ where: { status: "PENDING" } }),
    db.activity.count({ where: { status: "APPROVED" } }),
    db.agreement.findMany({ where: { endDate: { gte: now } }, select: { partnerId: true }, distinct: ["partnerId"] }),
    db.activity.findMany({ where: { status: "APPROVED", dateStart: { gte: sixMonthsAgo } }, select: { partnerId: true }, distinct: ["partnerId"] }),
    db.agreement.findMany({ where: { endDate: { gte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) } }, select: { partnerId: true, endDate: true } }),
    db.partner.count({ where: { status: "APPROVED", picName: null } }),
    db.partnerEditProposal.findMany({ where: { status: "PENDING" }, include: { partner: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const usedIds = new Set(activePartnerIds.map(a => a.partnerId));
  const recentIds = new Set(recentActivityPartnerIds.map(a => a.partnerId));
  const partnersUsed = [...recentIds].filter(id => usedIds.has(id)).length;
  const partnersUnused = [...usedIds].filter(id => !recentIds.has(id)).length;

  const pendingSubmissions = await db.partner.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10 });
  const pendingActivitiesList = await db.activity.findMany({ where: { status: "PENDING" }, include: { partner: { select: { name: true } }, lecturers: { orderBy: { order: "asc" } }, students: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" }, take: 10 });

  return NextResponse.json({
    kpi: { totalPartners, pendingPartners, pendingActivities, totalActivities, partnersUsed, partnersUnused, agreementsEndingSoon: agreementsEndingSoon.length, partnersWithoutPic },
    pendingPartners: pendingSubmissions.map(p => ({ id: p.id, name: p.name, level: p.level, category: p.category, createdAt: p.createdAt.toISOString() })),
    pendingActivitiesList: pendingActivitiesList.map(a => ({ id: a.id, title: a.title, type: a.type, partnerName: a.partner.name, submittedBy: a.submittedBy, createdAt: a.createdAt.toISOString(), lecturers: a.lecturers, students: a.students })),
    pendingEdits: pendingEdits.map(e => {
      const record = e as unknown as Record<string, unknown>;
      return {
        id: e.id, partnerId: e.partnerId, partnerName: e.partner.name, submitterName: e.submitterName, submitterEmail: e.submitterEmail, note: e.note, createdAt: e.createdAt.toISOString(),
        changes: Object.fromEntries(EDITABLE_FIELDS.flatMap(k => {
          const value = record[k];
          return value !== null && value !== undefined ? [[k, String(value)]] : [];
        })),
      };
    }),
  });
}
