"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PartnerLogoAdmin({ partnerId, hasLogo }: { partnerId: string; hasLogo: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    setLoading(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/partners/${partnerId}/logo`, { method: "PATCH", body: form });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Upload logo gagal."); return; }
      router.refresh();
    } catch { setMessage("Upload logo gagal. Periksa koneksi lalu coba lagi."); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove() {
    if (!window.confirm("Hapus logo mitra ini? Logo akan dihapus dari data mitra dan penyimpanan.")) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/partners/${partnerId}/logo`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Logo gagal dihapus."); return; }
      router.refresh();
    } catch { setMessage("Logo gagal dihapus. Periksa koneksi lalu coba lagi."); }
    finally { setLoading(false); }
  }

  return <div className="flex flex-col items-stretch gap-2 sm:items-end">
    <div className="flex flex-wrap gap-2">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"><ImagePlus className="h-3.5 w-3.5" /> {loading ? "Memproses..." : hasLogo ? "Ganti Logo" : "Tambah Logo"}</button>
      {hasLogo && <button type="button" onClick={() => void remove()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Hapus Logo</button>}
    </div>
    {message && <p className="max-w-xs text-right text-xs text-red-600">{message}</p>}
  </div>;
}
