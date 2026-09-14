"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Eye, Image as ImageIcon, FileText, Clock, MapPin } from "lucide-react";
import type { IaItem } from "@/components/ia-admin";

export default function IaCompletion({ completion, busy, setBusy, flash, reload }: { completion: IaItem[]; busy: boolean; setBusy: (v: boolean) => void; flash: (text: string, type?: "info" | "error") => void; reload: () => Promise<void> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function complete(item: IaItem) {
    setBusy(true);
    const res = await fetch("/api/admin/ia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: item.id }),
    });
    const d = await res.json();
    if (res.ok) { flash(`${item.activityCode || item.title} ditandai selesai.`); await reload(); } else flash(d.error || "Gagal menandai selesai.", "error");
    setBusy(false);
  }

  return <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-stone-100 p-5">
      <div>
        <h2 className="font-bold text-stone-900">Laporan Kegiatan</h2>
        <p className="mt-0.5 text-xs text-stone-500">Verifikasi laporan dan penyelesaian kegiatan</p>
      </div>
      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">{completion.length} pending</span>
    </div>
    {completion.length ? (
      <div className="divide-y divide-stone-100">
        {completion.map(item => {
          const isDirect = item.source === "IA_DIRECT";
          const isExpanded = expandedId === item.id;
          const hasDocLink = Boolean(item.reportLink);
          const hasPhoto = Boolean(item.photoUrl);
          const hasReport = Boolean(item.hasReport);
          const hasIa = Boolean(item.hasIa);
          const missing: string[] = [];
          if (!isDirect && !hasReport) missing.push("Laporan kegiatan (belum dilaporkan mahasiswa/tim)");
          if (!hasDocLink && !hasPhoto) missing.push("Dokumentasi (link Drive atau foto sampul)");
          if (!hasIa) missing.push("IA (belum diterbitkan)");
          const ready = missing.length === 0;

          return <div key={item.id} className="p-4">
            {/* Header row — always visible */}
            <button type="button" onClick={() => setExpandedId(isExpanded ? null : item.id)} className="flex w-full items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">{item.activityCode || item.title}</p>
                <p className="text-xs text-stone-500">{item.title} · {item.partnerName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {ready
                  ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Siap diselesaikan</span>
                  : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Data kurang</span>
                }
                <span className={`rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ${isExpanded ? "hidden sm:inline-block" : ""}`}>Menunggu penyelesaian</span>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && <div className="mt-4 space-y-4">
              {/* Basic info */}
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {item.dateStart && <div className="flex items-start gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" /><div><p className="text-xs text-stone-400">Periode</p><p className="font-semibold text-stone-800">{new Date(item.dateStart).toLocaleDateString("id-ID")}{item.dateEnd ? ` — ${new Date(item.dateEnd).toLocaleDateString("id-ID")}` : ""}</p></div></div>}
                {item.submittedBy && <div><p className="text-xs text-stone-400">Dilaporkan oleh</p><p className="font-semibold text-stone-800">{item.submittedBy}{item.submitterUnit ? ` · ${item.submitterUnit}` : ""}</p></div>}
                {item.reportDate && <div><p className="text-xs text-stone-400">Tanggal laporan</p><p className="font-semibold text-stone-800">{new Date(item.reportDate).toLocaleDateString("id-ID")}</p></div>}
                {item.students.length > 0 && <div><p className="text-xs text-stone-400">Mahasiswa ({item.students.length})</p><p className="font-semibold text-stone-800">{item.students.join(", ")}</p></div>}
              </div>

              {/* Report summary */}
              {!isDirect && item.reportSummary && <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <p className="text-xs font-semibold text-stone-500">Ringkasan kegiatan</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">{item.reportSummary}</p>
              </div>}
              {!isDirect && !hasReport && <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                <span><strong>Laporan belum ada.</strong> Mahasiswa atau tim belum mengirim laporan kegiatan. Minta mereka mengisi melalui halaman kegiatan.</span>
              </div>}

              {/* Checklist */}
              <div className="grid gap-2 sm:grid-cols-3">
                {isDirect
                  ? <CheckRow label="IA langsung (tanpa laporan)" team="Tim Kerja Sama" ok={true} />
                  : <CheckRow label="Laporan ada" team={hasReport ? "TERPENUHI" : "BELUM TERSEDIA"} ok={hasReport} />
                }
                <CheckRow label="Dokumentasi ada" team={(hasDocLink || hasPhoto) ? "TERPENUHI" : "BELUM TERSEDIA"} ok={hasDocLink || hasPhoto} />
                <CheckRow label="IA ada" team={hasIa ? "TERPENUHI" : "BELUM TERSEDIA"} ok={hasIa} />
              </div>

              {/* Submitted documents — clickable */}
              <div className="space-y-2">
                {item.reportLink && <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-medium text-stone-600">Link dokumentasi:</span>
                  <a href={item.reportLink} target="_blank" rel="noreferrer" className="min-w-0 truncate text-xs font-semibold text-emerald-700 hover:underline">{item.reportLink}</a>
                  <ExternalLink className="h-3 w-3 shrink-0 text-emerald-500" />
                </div>}
                {item.photoUrl && <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-medium text-stone-600">Foto sampul:</span>
                  <a href={item.photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">Lihat foto <Eye className="h-3 w-3" /></a>
                </div>}
                {!item.reportLink && !item.photoUrl && !isDirect && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-xs text-amber-800">Belum ada dokumentasi yang diunggah.</span>
                </div>}
              </div>

              {/* Missing warning */}
              {!ready && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800">Data belum lengkap:</p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                  {missing.map(m => <li key={m}>{m}</li>)}
                </ul>
                <p className="mt-2 text-xs text-amber-600">Hubungi pengaju untuk melengkapi data sebelum menandai selesai.</p>
              </div>}

              {/* Complete button */}
              <button type="button" onClick={() => void complete(item)} disabled={!ready || busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><CheckCircle2 className="h-4 w-4" /> Tandai Selesai</button>
            </div>}
          </div>;
        })}
      </div>
    ) : <div className="px-5 py-10 text-center text-sm text-stone-400">Tidak ada laporan kegiatan yang menunggu penyelesaian.</div>}
  </section>;
}

function CheckRow({ label, team, ok }: { label: string; team: string; ok: boolean }) {
  return <div className={`rounded-xl border p-3 ${ok ? "border-emerald-100 bg-emerald-50/60" : "border-stone-200 bg-stone-50"}`}>
    <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="text-red-500">×</span>}{label}</div>
    <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">{team}</p>
  </div>;
}
