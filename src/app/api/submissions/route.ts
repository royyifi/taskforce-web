import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const submissions = await db.activity.findMany({
    where: { status: "PENDING" },
    include: { partner: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    submissions: submissions.map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      partnerName: s.partner.name,
      partnerSlug: s.partner.slug,
      submittedBy: s.submittedBy,
      dateStart: s.dateStart?.toISOString() || null,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewNote } = body;
  if (!id || !status) return NextResponse.json({ error: "id dan status wajib." }, { status: 400 });
  if (!["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });

  const submission = await db.activity.findUnique({ where: { id }, include: { partner: true } });
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  await db.activity.update({
    where: { id },
    data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });

  await logAudit({
    action: status === "APPROVED" ? "APPROVE" : "REJECT",
    entityType: "Activity",
    entityId: id,
    entityName: submission.title,
    detail: `Kegiatan "${submission.title}" untuk mitra ${submission.partner.name}: ${status}. ${reviewNote || ""}`,
  });

  return NextResponse.json({ ok: true });
}
