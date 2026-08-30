import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await db.storedFile.findUnique({ where: { id } });
    if (!file) return new Response("File tidak ditemukan", { status: 404 });
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("file download error:", error);
    return new Response("Gagal memuat file", { status: 500 });
  }
}
