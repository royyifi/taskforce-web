import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLaporanWord } from "@/lib/report";

export const dynamic = "force-dynamic";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

export async function GET(request: Request) {
  if (!await requireAdmin()) return unauthorized();

  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from") || "";
  const toStr = url.searchParams.get("to") || "";

  /* ── Ambil ketua dari daftar tim ─────────────────────── */
  const leader = await db.teamMember.findFirst({ where: { isKetua: true } });
  const teamLeaderName = leader?.name || "Ketua Tim Kerja Sama";
  const teamLeaderPos = leader?.team === "KERJA_SAMA"
    ? "Ketua Tim Kerja Sama"
    : leader?.team === "MBKM"
      ? "Ketua Tim MBKM"
      : "Ketua Tim Kerja Sama Prodi THP";

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "Periode tanggal wajib diisi." }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr + "T23:59:59");

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
  }

  // Get all approved activities within period
  const activities = await db.activity.findMany({
    where: {
      status: "APPROVED",
      dateStart: { gte: from, lte: to },
    },
    include: {
      partner: { select: { name: true } },
      students: { select: { id: true } },
      lecturers: { select: { id: true } },
    },
    orderBy: { dateStart: "asc" },
  });

  // Count new partners: partners whose first activity in the system is in this period
  const allActivities = await db.activity.findMany({
    where: { status: "APPROVED" },
    select: { partnerId: true, dateStart: true },
    orderBy: { dateStart: "asc" },
  });
  const partnerFirstSeen = new Map<string, Date>();
  for (const a of allActivities) {
    if (!partnerFirstSeen.has(a.partnerId) && a.dateStart) {
      partnerFirstSeen.set(a.partnerId, a.dateStart);
    }
  }
  const newPartnerCount = [...partnerFirstSeen.entries()].filter(
    ([, first]) => first >= from && first <= to
  ).length;

  const reportActivities = activities.map(a => ({
    title: a.title,
    partner: a.partner.name,
    iaNumber: a.iaNumber,
    dateStart: a.dateStart,
    dateEnd: a.dateEnd,
    studentCount: a.students.length,
    lecturerCount: a.lecturers.length,
    reportLink: a.reportLink,
  }));

  const buffer = await generateLaporanWord({
    activities: reportActivities,
    from,
    to,
    newPartnerCount,
    teamLeaderName,
    teamLeaderPosition: teamLeaderPos,
  });

  const periode = `${fromStr}_sd_${toStr}`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Laporan_Kerja_Sama_${periode}.docx"`,
    },
  });
}
