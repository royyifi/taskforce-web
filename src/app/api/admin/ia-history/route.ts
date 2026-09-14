import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

export async function GET(request: Request) {
  if (!await requireAdmin()) return unauthorized();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const year = url.searchParams.get("year") || "";
  const status = url.searchParams.get("status") || "";

  const where: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (year && year !== "all") {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59`);
    where.dateStart = { gte: start, lte: end };
  }

  if (status === "completed") {
    where.completedAt = { not: null };
  } else if (status === "active") {
    where.completedAt = null;
  }

  const activities = await db.activity.findMany({
    where,
    include: {
      partner: { select: { name: true, slug: true } },
      students: { orderBy: { order: "asc" as const } },
      lecturers: true,
    },
    orderBy: { dateStart: "desc" },
  });

  const filtered = search
    ? activities.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.partner.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.iaNumber && a.iaNumber.toLowerCase().includes(search.toLowerCase())) ||
        (a.activityCode && a.activityCode.toLowerCase().includes(search.toLowerCase()))
      )
    : activities;

  const items = filtered.map(a => ({
    id: a.id,
    activityCode: a.activityCode,
    iaNumber: a.iaNumber,
    title: a.title,
    partnerName: a.partner.name,
    partnerSlug: a.partner.slug,
    submittedBy: a.submittedBy,
    submitterNim: a.submitterNim,
    submitterUnit: a.submitterUnit,
    submittedEmail: a.submittedEmail,
    dateStart: a.dateStart?.toISOString() || null,
    dateEnd: a.dateEnd?.toISOString() || null,
    iaUrl: a.iaUrl,
    rkpUrl: a.rkpUrl,
    spmUrl: a.spmUrl,
    reportLink: a.reportLink,
    studentCount: a.students.length,
    lecturerCount: a.lecturers.length,
    completedAt: a.completedAt?.toISOString() || null,
    source: a.source,
    students: a.students.map(s => s.name),
    lecturers: a.lecturers.map(l => l.name),
  }));

  return NextResponse.json({ items });
}
