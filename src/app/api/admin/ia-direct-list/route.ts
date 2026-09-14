import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function unauthorized() { return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 }); }

export async function GET() {
  if (!await requireAdmin()) return unauthorized();
  const partners = await db.partner.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, level: true, picName: true, picPosition: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ partners });
}
