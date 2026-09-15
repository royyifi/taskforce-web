import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let i = 0;
  while (true) {
    const exists = await db.partner.findUnique({ where: { slug } });
    if (!exists) return slug;
    i++;
    slug = `${slugify(base)}-${i}`;
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const body = await request.json();
  const { name, level, address, picName, picPosition, logoFileId } = body;

  if (!name || !String(name).trim()) return NextResponse.json({ error: "Nama mitra wajib diisi." }, { status: 400 });
  if (logoFileId) {
    const logo = await db.storedFile.findUnique({ where: { id: String(logoFileId) } });
    if (!logo || !logo.mimeType.startsWith("image/")) return NextResponse.json({ error: "Logo mitra tidak valid." }, { status: 400 });
  }

  const slug = await uniqueSlug(String(name).trim());
  const partner = await db.partner.create({
    data: {
      slug,
      name: String(name).trim(),
      level: level || "NASIONAL",
      status: "APPROVED",
      address: address || null,
      picName: picName || null,
      picPosition: picPosition || null,
      source: "IA_DIRECT",
      logoFileId: logoFileId ? String(logoFileId) : null,
      verifiedById: session.id,
      verifiedAt: new Date(),
    },
  });

  await logAudit({ action: "CREATE", entityType: "Partner", entityId: partner.id, entityName: partner.name, detail: `Mitra "${partner.name}" dibuat langsung oleh ${session.name} untuk IA` });

  return NextResponse.json({ ok: true, partner: { id: partner.id, name: partner.name } });
}
