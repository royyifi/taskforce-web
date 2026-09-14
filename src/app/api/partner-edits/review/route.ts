import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

const VALID_CODES = ["MG", "PD", "PM", "PN", "PP", "SPI"];

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
    // Terapkan perubahan data mitra
    const data: Record<string, string> = {};
    const EDITABLE = ["name", "level", "category", "address", "phone", "email", "website", "picName", "picPosition", "picPhone", "picEmail", "city", "country", "description"];
    for (const key of EDITABLE) {
      const value = (proposal as unknown as Record<string, unknown>)[key];
      if (value !== null && value !== undefined) data[key] = String(value);
    }
    if (Object.keys(data).length > 0) await db.partner.update({ where: { id: proposal.partnerId }, data: data as never });

    // Terapkan perubahan potensi kerja sama jika ada
    if (proposal.proposedFields) {
      try {
        const newCodes: string[] = JSON.parse(proposal.proposedFields);
        const validCodes = newCodes.filter(c => VALID_CODES.includes(c));
        // Hapus relasi lama
        await db.partnerField.deleteMany({ where: { partnerId: proposal.partnerId } });
        // Buat relasi baru
        for (const code of validCodes) {
          const field = await db.cooperationField.findUnique({ where: { code } });
          if (field) {
            await db.partnerField.create({
              data: { partnerId: proposal.partnerId, cooperationFieldId: field.id },
            });
          }
        }
      } catch {
        console.error("Gagal memproses proposedFields:", proposal.proposedFields);
      }
    }
  }

  await db.partnerEditProposal.update({ where: { id }, data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() } });
  await logAudit({
    action: status === "APPROVED" ? "APPROVE" : "REJECT", entityType: "PartnerEditProposal",
    entityId: id, entityName: proposal.partner.name,
    detail: `Usulan perbaikan data "${proposal.partner.name}": ${status}. ${reviewNote || ""}${proposal.proposedFields ? ` Bidang kerja sama: ${proposal.proposedFields}` : ""}`,
  });

  return NextResponse.json({ ok: true });
}
