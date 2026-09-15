import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await request.json();
    const activityId = typeof body.activityId === "string" ? body.activityId : "";
    const action = typeof body.action === "string" ? body.action : "";
    const iaNumber = typeof body.iaNumber === "string" ? body.iaNumber.trim() : "";
    const iaUrl = typeof body.iaUrl === "string" ? body.iaUrl.trim() : "";
    const iaLanguage = body.iaLanguage === "EN" ? "EN" : "ID";
    if (!activityId) return NextResponse.json({ error: "Kegiatan tidak valid." }, { status: 400 });
    const activity = await db.activity.findUnique({ where: { id: activityId } });
    if (!activity || activity.status !== "APPROVED") return NextResponse.json({ error: "Kegiatan tidak ditemukan atau belum disetujui." }, { status: 404 });
    if (action === "publish") {
      if (!iaNumber) return NextResponse.json({ error: "Nomor IA wajib diisi." }, { status: 400 });
      if (!/^https?:\/\//.test(iaUrl)) return NextResponse.json({ error: "Link Google Drive dokumen IA wajib berupa URL." }, { status: 400 });
      const updateData: Record<string, unknown> = { iaNumber, iaUrl, iaLanguage, iaStatus: "DISETUJUI", iaReviewNote: null, iaSubmittedAt: activity.iaSubmittedAt || new Date() };
      if (activity.source === "IA_DIRECT") {
        updateData.activityCode = iaNumber;
        updateData.iaStatus = "DITANDATANGANI";
        updateData.iaConfirmedAt = new Date();
        if (activity.iaProposalLogoFileId) {
          const proposalLogo = await db.storedFile.findUnique({ where: { id: activity.iaProposalLogoFileId } });
          if (!proposalLogo || !proposalLogo.mimeType.startsWith("image/")) return NextResponse.json({ error: "Logo usulan IA tidak valid atau sudah tidak tersedia." }, { status: 400 });
          const partner = await db.partner.findUnique({ where: { id: activity.partnerId }, select: { logoFileId: true } });
          if (!partner) return NextResponse.json({ error: "Mitra kegiatan tidak ditemukan." }, { status: 404 });
          const promotedLogoId = activity.iaProposalLogoFileId;
          updateData.iaPartnerLogoFileId = promotedLogoId;
          updateData.iaProposalLogoFileId = null;
          await db.$transaction([
            db.partner.update({ where: { id: activity.partnerId }, data: { logoFileId: promotedLogoId } }),
            db.activity.update({ where: { id: activityId }, data: updateData as never }),
          ]);
          if (partner.logoFileId && partner.logoFileId !== promotedLogoId) await db.storedFile.deleteMany({ where: { id: partner.logoFileId } });
        } else {
          await db.activity.update({ where: { id: activityId }, data: updateData as never });
        }
      } else {
        await db.activity.update({ where: { id: activityId }, data: updateData as never });
      }
      await logAudit({ action: "APPROVE", entityType: "Activity", entityId: activityId, entityName: activity.title, detail: `IA ${iaNumber} diterbitkan oleh ${session.name}` });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("IA admin action error:", error);
    return NextResponse.json({ error: "Aksi IA gagal." }, { status: 500 });
  }
}
