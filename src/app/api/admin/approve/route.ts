import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewNote } = body;
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

  await db.partner.update({ where: { id }, data: { status, verifiedAt: new Date(), internalNote: status === "REJECTED" ? (reviewNote || "Ditolak") : partner.internalNote } });

  await logAudit({
    action: status === "APPROVED" ? "APPROVE" : "REJECT",
    entityType: "Partner", entityId: id, entityName: partner.name,
    detail: `Mitra "${partner.name}": ${status}. ${reviewNote || ""}`,
  });

  return NextResponse.json({ ok: true });
}
