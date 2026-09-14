import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json();
  const activityId = typeof body.activityId === "string" ? body.activityId : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!activityId || !note) return NextResponse.json({ error: "Catatan kesalahan wajib diisi." }, { status: 400 });
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.status !== "APPROVED" || !activity.iaNumber) return NextResponse.json({ error: "IA belum diterbitkan." }, { status: 400 });
  if (activity.iaConfirmedAt) return NextResponse.json({ error: "IA sudah dikonfirmasi; hubungi Tim Kerja Sama untuk perubahan." }, { status: 400 });
  await db.activity.update({ where: { id: activityId }, data: { iaStatus: "REVISI", iaReviewNote: note } });
  await logAudit({ action: "UPDATE", entityType: "Activity", entityId: activityId, entityName: activity.title, detail: `Mahasiswa mengajukan perbaikan IA: ${note}` });
  return NextResponse.json({ ok: true });
}
