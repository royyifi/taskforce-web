import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json();
  const activityId = typeof body.activityId === "string" ? body.activityId : "";
  if (!activityId) return NextResponse.json({ error: "Kegiatan wajib dipilih." }, { status: 400 });
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.status !== "APPROVED" || !activity.iaNumber) return NextResponse.json({ error: "IA belum tersedia untuk kegiatan ini." }, { status: 400 });
  if (activity.iaConfirmedAt) return NextResponse.json({ error: "IA sudah dikonfirmasi." }, { status: 400 });
  await db.activity.update({ where: { id: activityId }, data: { iaConfirmedAt: new Date() } });
  await logAudit({ action: "UPDATE", entityType: "Activity", entityId: activityId, entityName: activity.title, detail: `Mahasiswa mengonfirmasi penerimaan IA ${activity.iaNumber}` });
  return NextResponse.json({ ok: true });
}
