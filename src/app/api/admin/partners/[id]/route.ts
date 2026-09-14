import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Hanya admin yang dapat menghapus mitra." }, { status: 401 });

  const { id } = await params;
  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

  // Force delete — hapus semua data terkait (activities, agreements, fields, proposals)
  await db.activity.deleteMany({ where: { partnerId: id } });
  await db.agreement.deleteMany({ where: { partnerId: id } });
  await db.partnerField.deleteMany({ where: { partnerId: id } });
  await db.partnerEditProposal.deleteMany({ where: { partnerId: id } });
  await db.partner.delete({ where: { id } });

  await logAudit({
    action: "DELETE", entityType: "Partner", entityId: id, entityName: partner.name,
    detail: `Admin menghapus mitra "${partner.name}" (force delete)`,
  });

  return NextResponse.json({ ok: true, message: `Mitra "${partner.name}" berhasil dihapus.` });
}
