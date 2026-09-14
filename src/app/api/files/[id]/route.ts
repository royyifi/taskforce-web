import { getStoredFile } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await getStoredFile(id);
  if (!file) return new Response("File tidak ditemukan", { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.mimeType, "Content-Length": String(file.size), "Cache-Control": "public, max-age=31536000, immutable" } });
}
