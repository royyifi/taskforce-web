"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, RefreshCw, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IaConfirm({ activityId, iaNumber, iaUrl, confirmed }: { activityId: string; iaNumber: string; iaUrl: string | null; confirmed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRevisi, setShowRevisi] = useState(false);
  const [revisiNote, setRevisiNote] = useState("");
  const [revisiBusy, setRevisiBusy] = useState(false);
  const [revisiError, setRevisiError] = useState("");

  async function confirm() {
    setLoading(true); setError("");
    const res = await fetch("/api/activities/ia-confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId }) });
    const data = await res.json();
    if (res.ok) router.refresh(); else setError(data.error || "Konfirmasi IA gagal.");
    setLoading(false);
  }

  async function requestRevision() {
    if (!revisiNote.trim()) { setRevisiError("Tuliskan kesalahan pada dokumen."); return; }
    setRevisiBusy(true); setRevisiError("");
    const res = await fetch("/api/activities/ia-request-change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId, note: revisiNote.trim() }) });
    const data = await res.json();
    if (res.ok) router.refresh(); else setRevisiError(data.error || "Pengajuan perbaikan gagal.");
    setRevisiBusy(false);
  }

  return (
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Dokumen IA</p>
          <p className="mt-1 font-semibold text-stone-900">Nomor IA: {iaNumber}</p>
          {confirmed && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Sudah dikonfirmasi diterima — dokumen tetap dapat diunduh kapan saja.</p>}
          <p className="mt-1 text-sm text-stone-600">Periksa dokumen IA. Jika ada kesalahan, ajukan perbaikan; jika sudah benar, konfirmasi penerimaan.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {iaUrl ? (
              <a href={iaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                <Download className="h-4 w-4" /> Download Dokumen IA
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-500">Link dokumen belum tersedia</span>
            )}
            {confirmed ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> IA Diterima</span>
            ) : (
              <>
                <button type="button" onClick={() => { setShowRevisi(v => !v); }} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">
                  <RefreshCw className="h-4 w-4" /> Ajukan Ulang / Minta Perbaikan
                </button>
                <button type="button" onClick={confirm} disabled={loading} className="inline-flex items-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                  {loading ? "Menyimpan..." : "Konfirmasi IA Diterima"}
                </button>
              </>
            )}
          </div>
          {showRevisi && !confirmed && <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3">
            <label className="block text-xs font-semibold text-stone-700">Tuliskan kesalahan pada dokumen IA:</label>
            <textarea value={revisiNote} onChange={e => setRevisiNote(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" placeholder="Contoh: nama penandatangan mitra salah tulis" />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={requestRevision} disabled={revisiBusy} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"><Send className="h-3.5 w-3.5" /> {revisiBusy ? "Mengirim..." : "Kirim Pengajuan Perbaikan"}</button>
              <button type="button" onClick={() => setShowRevisi(false)} className="text-xs font-semibold text-stone-500 hover:text-stone-700">Batal</button>
            </div>
            {revisiError && <p className="mt-2 text-xs text-red-700">{revisiError}</p>}
          </div>}
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
