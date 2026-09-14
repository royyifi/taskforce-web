import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const EDITABLE = ["name", "level", "category", "address", "phone", "email", "website", "picName", "picPosition", "picPhone", "picEmail", "city", "country", "description"] as const;
const VALID_CODES = ["MG", "PD", "PM", "PN", "PP", "SPI"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, submitterName, submitterEmail, submitterUnit, note, proposedFields, ...rest } = body;
    if (!partnerId || !submitterName) return NextResponse.json({ error: "Nama pelapor wajib diisi." }, { status: 400 });
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(submitterEmail))) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });

    const partner = await db.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });

    // Simpan hanya field yang benar-benar berubah
    const changes: Record<string, string> = {};
    for (const key of EDITABLE) {
      const value = rest[key];
      if (value === undefined || value === null) continue;
      const current = (partner as Record<string, unknown>)[key];
      if (String(value).trim() !== String(current ?? "")) changes[key] = String(value).trim();
    }

    // Validasi & simpan proposedFields (kode kerja sama)
    let storedFields: string | null = null;
    if (Array.isArray(proposedFields)) {
      const validCodes = [...new Set(proposedFields.filter((f: string) => VALID_CODES.includes(f)))];
      if (validCodes.length === 0) return NextResponse.json({ error: "Kode potensi kerja sama tidak valid." }, { status: 400 });
      // Bandingkan dengan bidang saat ini
      const currentFieldIds = await db.partnerField.findMany({ where: { partnerId }, select: { cooperationField: { select: { code: true } } } });
      const currentCodes = currentFieldIds.map(pf => pf.cooperationField.code).sort().join(",");
      if (validCodes.sort().join(",") !== currentCodes) {
        storedFields = JSON.stringify(validCodes);
      }
    }

    if (Object.keys(changes).length === 0 && !storedFields) return NextResponse.json({ error: "Tidak ada perubahan yang dikirim." }, { status: 400 });

    const proposal = await db.partnerEditProposal.create({
      data: {
        partnerId,
        ...changes,
        proposedFields: storedFields,
        submitterName,
        submitterEmail: submitterEmail || null,
        submitterUnit: submitterUnit || null,
        note: note || null,
      } as never,
    });

    const changeFields = Object.keys(changes).join(", ");
    const fieldNote = storedFields ? ` | Bidang: ${storedFields}` : "";
    await logAudit({
      action: "CREATE", entityType: "PartnerEditProposal", entityId: proposal.id,
      entityName: partner.name, detail: `Usulan perbaikan data mitra "${partner.name}" dari ${submitterName}: ${changeFields || "(bidang kerja sama)"}${fieldNote}`,
    });

    return NextResponse.json({ ok: true, message: "Usulan perbaikan berhasil dikirim dan menunggu verifikasi admin." }, { status: 201 });
  } catch (err) {
    console.error("partner-edits POST error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("partnerId");
  const proposals = await db.partnerEditProposal.findMany({
    where: { partnerId: partnerId || undefined, status: "PENDING" },
    include: { partner: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ proposals });
}
