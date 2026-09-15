import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

function cleanParticipants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => typeof item === "object" && item !== null ? item as { name?: unknown } : { name: item })
    .filter(item => typeof item.name === "string" && item.name.trim())
    .map((item, order) => ({ name: String(item.name).trim(), order }));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const body = await request.json();
  const {
    partnerId, programName, dateStart, dateEnd, location,
    personil, firstParty, lang, proposalLogoFileId,
    partnerPIC, partnerPICPosition, source,
  } = body;

  if (!partnerId) return NextResponse.json({ error: "Mitra wajib dipilih." }, { status: 400 });
  if (!programName || !String(programName).trim()) return NextResponse.json({ error: "Nama program wajib diisi." }, { status: 400 });
  if (!dateStart || !dateEnd) return NextResponse.json({ error: "Tanggal mulai dan selesai wajib diisi." }, { status: 400 });
  const partner = await db.partner.findUnique({ where: { id: partnerId, status: "APPROVED" } });
  if (!partner) return NextResponse.json({ error: "Mitra tidak ditemukan atau belum disetujui." }, { status: 404 });

  if (!partner.logoFileId && !proposalLogoFileId) return NextResponse.json({ error: "Logo mitra belum diunggah. Tambahkan logo pada data mitra atau unggah logo baru melalui form." }, { status: 400 });

  // Verify logo
  const logoId = partner.logoFileId || String(proposalLogoFileId);
  const logo = await db.storedFile.findUnique({ where: { id: logoId } });
  if (!logo || !logo.mimeType.startsWith("image/")) return NextResponse.json({ error: "Logo mitra tidak valid." }, { status: 400 });

  const studentRows = cleanParticipants(personil);

  // Create activity — langsung APPROVED + IA DIAJUKAN
  const activity = await db.activity.create({
    data: {
      partnerId,
      title: String(programName).trim(),
      type: "KERJA_SAMA",
      dateStart: new Date(dateStart),
      dateEnd: new Date(dateEnd),
      location: location || null,
      status: "APPROVED",
      reviewedAt: new Date(),
      partnerPic: partnerPIC || null,
      partnerPICPosition: partnerPICPosition || null,
      iaPartnerLogoFileId: partner.logoFileId,
      iaProposalLogoFileId: proposalLogoFileId ? String(proposalLogoFileId) : null,
      iaStatus: "DIAJUKAN",
      iaSubmittedAt: new Date(),
      iaFirstParty: firstParty || "PRODI",
      iaLanguage: lang || "ID",
      iaProgramName: String(programName).trim(),
      iaPartnerName: partner.name,
      iaPartnerPicName: partnerPIC || partner.picName || null,
      iaPartnerPicPosition: partnerPICPosition || partner.picPosition || null,
      iaPartnerAddress: partner.address || null,
      submittedBy: "Tim Kerja Sama",
      submittedEmail: null,
      source: "IA_DIRECT",
      participants: studentRows.length || null,
      students: { create: studentRows },
    },
  });

  await logAudit({
    action: "CREATE",
    entityType: "Activity",
    entityId: activity.id,
    entityName: activity.title,
    detail: `IA langsung dibuat oleh ${session.name}: "${programName}" dengan mitra ${partner.name}. Masuk antrean penerbitan.`,
  });

  return NextResponse.json({ ok: true, id: activity.id, message: `IA "${programName}" berhasil dibuat. Langsung masuk antrean penerbitan.` });
}
