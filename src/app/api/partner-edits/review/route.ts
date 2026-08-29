import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat memproses usulan." }, { status: 401 });

  const body = await request.json();
  const { id, status, reviewNote } = body;
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const proposal = await db.partnerEditProposal.findUnique({ where: { id }, include: { partner: true } });
  if (!proposal) return NextResponse.json({ error: "Usulan tidak ditemukan." }, { status: 404 });
  if (proposal.status !== "PENDING") return NextResponse.json({ error: "Usulan sudah diproses." }, { status: 400 });

  if (status === "APPROVED") {
    const data: Record<string, string> = {};
    const EDITABLE = ["name", "level", "category", "address", "phone", "email", "website", "picName", "picPosition", "picPhone", "picEmail", "city", "country", "description"];
    for (const key of EDITABLE) {
      const value = (proposal as unknown as Record<string, unknown>)[key];
      if (value !== null && value !== undefined) data[key] = String(value);
    }
    if (Object.keys(data).length > 0) await db.partner.update({ where: { id: proposal.partnerId }, data: data as never });
  }

  await db.partnerEditProposal.update({ where: { id }, data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() } });
  await logAudit({
    action: status === "APPROVED" ? "APPROVE" : "REJECT", entityType: "PartnerEditProposal",
    entityId: id, entityName: proposal.partner.name,
    detail: `Usulan perbaikan data "${proposal.partner.name}": ${status}. ${reviewNote || ""}`,
  });

  return NextResponse.json({ ok: true });
}
