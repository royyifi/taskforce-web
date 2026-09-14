import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Kegiatan yang sedang berlangsung: aturan sama dengan stage 5 di halaman status.
export async function GET() {
  const now = new Date();
  const activities = await db.activity.findMany({
    where: { status: "APPROVED", completedAt: null },
    include: { partner: { select: { name: true } } },
    orderBy: { dateStart: "desc" },
  });
  const ongoing = activities
    .filter(a => a.dateStart && a.dateStart <= now)
    .map(a => ({
      id: a.id,
      activityCode: a.activityCode,
      title: a.title,
      partnerName: a.partner.name,
      dateStart: a.dateStart?.toISOString() || null,
      dateEnd: a.dateEnd?.toISOString() || null,
      location: a.location,
      submittedBy: a.submittedBy,
      submitterUnit: a.submitterUnit,
    }));
  return NextResponse.json({ activities: ongoing });
}
