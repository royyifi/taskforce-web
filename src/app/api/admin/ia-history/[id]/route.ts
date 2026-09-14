import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { rkpUrl, spmUrl, iaUrl } = body;

  const activity = await db.activity.findUnique({ where: { id } });
  if (!activity) return NextResponse.json({ error: "Kegiatan tidak ditemukan." }, { status: 404 });

  const updates: Record<string, string | null> = {};
  if (rkpUrl !== undefined) updates.rkpUrl = rkpUrl || null;
  if (spmUrl !== undefined) updates.spmUrl = spmUrl || null;
  if (iaUrl !== undefined) updates.iaUrl = iaUrl || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah." }, { status: 400 });
  }

  await db.activity.update({ where: { id }, data: updates });
  await logAudit({
    action: "UPDATE",
    entityType: "Activity",
    entityId: id,
    entityName: activity.title,
    detail: `Link dokumen diperbarui oleh ${session.name}: ${Object.keys(updates).join(", ")}`,
  });

  return NextResponse.json({ ok: true });
}
