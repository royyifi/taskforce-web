import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const partner = await db.partner.findUnique({
      where: { slug, status: "APPROVED" },
      include: {
        cooperationFields: { include: { cooperationField: true } },
        agreements: { orderBy: { startDate: "desc" } },
        activities: { where: { status: "APPROVED" }, orderBy: { dateStart: "desc" } },
      },
    });
    if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
    const recentActivities = partner.activities.filter(a => a.dateStart && a.dateStart >= sixMonthsAgo);
    const agreementActive = partner.agreements.some(a => a.endDate && a.endDate > now);

    return NextResponse.json({
      partner: {
        ...partner,
        agreements: partner.agreements.map(a => ({
          ...a,
          startDate: a.startDate?.toISOString() || null,
          endDate: a.endDate?.toISOString() || null,
        })),
        activities: partner.activities.map(a => ({
          ...a,
          dateStart: a.dateStart?.toISOString() || null,
          dateEnd: a.dateEnd?.toISOString() || null,
          createdAt: a.createdAt.toISOString(),
        })),
        utilization: recentActivities.length > 0 ? "USED" : "UNUSED",
        totalActivities: partner.activities.length,
        hasAgreement: partner.agreements.length > 0,
        agreementActive,
        fieldNames: partner.cooperationFields.map(f => f.cooperationField.name),
        fieldCodes: partner.cooperationFields.map(f => f.cooperationField.code),
      },
    });
  }

  const partners = await db.partner.findMany({
    where: { status: "APPROVED" },
    include: {
      cooperationFields: { include: { cooperationField: true } },
      agreements: true,
      activities: { where: { status: "APPROVED" }, select: { id: true, dateStart: true } },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const result = partners.map(p => {
    const recentActivities = p.activities.filter(a => a.dateStart && a.dateStart >= sixMonthsAgo);
    const lastActivity = p.activities.length > 0
      ? p.activities.sort((a, b) => (b.dateStart?.getTime() || 0) - (a.dateStart?.getTime() || 0))[0]
      : null;
    const agreementActive = p.agreements.some(a => a.endDate && a.endDate > now);

    let utilizationLabel: string;
    let utilizationColor: string;

    if (recentActivities.length > 0) {
      utilizationLabel = "Sudah Digunakan";
      utilizationColor = "green";
    } else if (p.agreements.length > 0) {
      utilizationLabel = "Belum Digunakan";
      utilizationColor = "yellow";
    } else {
      utilizationLabel = "Potensial";
      utilizationColor = "blue";
    }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      level: p.level,
      category: p.category,
      city: p.city,
      country: p.country,
      utilizationLabel,
      utilizationColor,
      fieldNames: p.cooperationFields.map(f => f.cooperationField.name),
      totalActivities: p.activities.length,
      lastActivityDate: lastActivity?.dateStart?.toISOString() || null,
    };
  });

  return NextResponse.json({ partners: result });
}
