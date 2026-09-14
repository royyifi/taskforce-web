import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await request.json() : await request.formData();
  const get = (key: string) => body instanceof FormData ? body.get(key) as string | null : typeof body[key] === "string" ? body[key] : null;
  const activityId = get("activityId");
  const reportDate = get("reportDate");
  const reportSummary = get("reportSummary");
  const reportLink = get("reportLink");
  const photoUrl = get("photoUrl");

  if (!activityId || !reportSummary || !reportLink || !photoUrl) {
    return isJson ? NextResponse.json({ error: "Aktivitas, ringkasan, foto sampul, dan link dokumentasi wajib diisi." }, { status: 400 }) : NextResponse.redirect(new URL("/magang", request.url));
  }

  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity) return isJson ? NextResponse.json({ error: "Kegiatan tidak ditemukan." }, { status: 404 }) : NextResponse.redirect(new URL("/magang", request.url));
  if (activity.status !== "APPROVED" || activity.completedAt || !activity.dateStart || activity.dateStart > new Date()) {
    return isJson ? NextResponse.json({ error: "Kegiatan tidak sedang berlangsung." }, { status: 400 }) : NextResponse.redirect(new URL(`/magang/kegiatan/${activityId}`, request.url));
  }

  await db.activity.update({
    where: { id: activityId },
    data: {
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      reportSummary: reportSummary || null,
      reportLink: reportLink || null,
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  await logAudit({
    action: "UPDATE", entityType: "Activity", entityId: activityId, entityName: activity.title,
    detail: `Laporan kegiatan diajukan untuk ${activity.activityCode || activity.title}`,
  });

  return isJson ? NextResponse.json({ ok: true, id: activityId }) : NextResponse.redirect(new URL(`/magang/kegiatan/${activityId}`, request.url));
}
