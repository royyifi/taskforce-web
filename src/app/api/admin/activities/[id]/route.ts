import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat menghapus kegiatan." }, { status: 401 });

  const { id } = await params;
  const activity = await db.activity.findUnique({
    where: { id },
    select: { id: true, title: true, activityCode: true, partner: { select: { name: true } } },
  });
  if (!activity) return NextResponse.json({ error: "Kegiatan tidak ditemukan." }, { status: 404 });

  await db.activityLecturer.deleteMany({ where: { activityId: id } });
  await db.activityStudent.deleteMany({ where: { activityId: id } });
  await db.activity.delete({ where: { id } });

  await logAudit({
    action: "DELETE",
    entityType: "Activity",
    entityId: id,
    entityName: activity.activityCode || activity.title,
    detail: `Admin menghapus kegiatan "${activity.activityCode || activity.title}" dari mitra "${activity.partner.name}"`,
  });

  return NextResponse.json({ ok: true, message: `Kegiatan "${activity.activityCode || activity.title}" berhasil dihapus.` });
}
