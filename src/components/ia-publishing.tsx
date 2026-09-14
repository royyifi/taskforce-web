"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Download, Eye, FileSignature, FileText, Link2 } from "lucide-react";

interface IaItem {
  id: string; activityCode: string | null; title: string; partnerName: string; submittedBy: string | null; submitterUnit: string | null;
  dateStart: string | null; dateEnd: string | null; students: string[]; iaNumber: string | null; iaUrl: string | null; iaConfirmedAt: string | null;
  reportDate: string | null; reportSummary: string | null; reportLink: string | null; iaStatus?: string | null; iaReviewNote?: string | null;
  iaPartnerPicName?: string | null; iaPartnerPicPosition?: string | null; hasLogo?: boolean; spmUrl?: string | null;
  iaLanguage?: string | null; source?: string | null;
  hasReport?: boolean; hasDocs?: boolean; hasIa?: boolean;
}

export { type IaItem };

export default function IaPublishing({ waiting, issued, busy, setBusy, flash, reload }: { waiting: IaItem[]; issued: IaItem[]; busy: boolean; setBusy: (v: boolean) => void; flash: (text: string, type?: "info" | "error") => void; reload: () => Promise<void> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [numberDrafts, setNumberDrafts] = useState<Record<string, string>>({});
  const [driveDrafts, setDriveDrafts] = useState<Record<string, string>>({});
  const [langDrafts, setLangDrafts] = useState<Record<string, "ID" | "EN">>({});

  function langOf(item: IaItem): "ID" | "EN" {
    return langDrafts[item.id] ?? (item.iaLanguage === "EN" ? "EN" : "ID");
  }

  async function publish(item: IaItem) {
    setBusy(true);
    const lang = langOf(item);
    const res = await fetch("/api/activities/ia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: item.id, action: "publish",
        iaNumber: (numberDrafts[item.id] || "").trim(),
        iaUrl: (driveDrafts[item.id] || "").trim(),
        iaLanguage: lang,
      }),
    });
    const d = await res.json();
    if (res.ok) { flash("IA diterbitkan. Mahasiswa kini dapat mengunduh dokumen."); await reload(); } else flash(d.error || "Penerbitan IA gagal.", "error");
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 p-5">
        <div>
          <h2 className="font-bold text-stone-900">Penerbitan IA</h2>
          <p className="mt-0.5 text-xs text-stone-500">Data IA otomatis dari pengajuan. Pilih bahasa, preview, unduh, finalisasi, lalu terbitkan link Google Drive.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{waiting.length} menunggu</span>
      </div>

      {waiting.length ? (
        <div className="divide-y divide-stone-100">
          {waiting.map(item => {
            const open = expandedId === item.id;
            const currentLang = langOf(item);
            return (
              <div key={item.id} className="p-4">
                <button type="button" onClick={() => setExpandedId(open ? null : item.id)} className="flex w-full items-center gap-3 text-left">
                  {open ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronRight className="h-4 w-4 text-stone-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.activityCode && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.activityCode}</span>}
                      <p className="truncate text-sm font-semibold text-stone-800">{item.title}</p>
                      {currentLang === "EN" && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">EN</span>}
                    </div>
                    <p className="mt-1 text-xs text-stone-400">{item.partnerName} · PIC: {item.iaPartnerPicName || "otomatis dari pengajuan"}{item.iaStatus === "REVISI" ? " · ada catatan perbaikan" : ""}</p>
                  </div>
                </button>

                {open && (
                  <div className="ml-7 mt-4 space-y-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
                    {item.iaReviewNote && <p className="rounded-lg bg-amber-100 p-3 text-xs text-amber-900"><strong>Catatan:</strong> {item.iaReviewNote}</p>}
                    {!item.hasLogo && <p className="rounded-lg bg-red-100 p-3 text-xs text-red-800">Logo mitra belum tersedia pada pengajuan ini.</p>}
                    <p className="text-xs text-stone-600">Penandatangan mitra: <strong>{item.iaPartnerPicName || "-"}</strong>{item.iaPartnerPicPosition ? ` — ${item.iaPartnerPicPosition}` : ""}</p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Bahasa dokumen</span>
                        <select value={currentLang} onChange={e => setLangDrafts(p => ({ ...p, [item.id]: e.target.value as "ID" | "EN" }))} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm">
                          <option value="ID">🇮🇩 Indonesia</option>
                          <option value="EN">🇬🇧 English</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Nomor IA *</span>
                        <input value={numberDrafts[item.id] ?? ""} onChange={e => setNumberDrafts(p => ({ ...p, [item.id]: e.target.value }))} placeholder="IA-2026-001" className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Link Google Drive *</span>
                        <input value={driveDrafts[item.id] ?? ""} onChange={e => setDriveDrafts(p => ({ ...p, [item.id]: e.target.value }))} placeholder="https://drive.google.com/..." className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a href={`/ia/${item.id}?lang=${currentLang}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                        <Eye className="h-4 w-4" /> Preview IA
                      </a>
                      <a href={`/api/ia/${item.id}/docx?lang=${currentLang}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                        <Download className="h-4 w-4" /> Download Word
                      </a>
                      <button type="button" onClick={() => void publish(item)} disabled={busy || !(numberDrafts[item.id] || "").trim() || !(driveDrafts[item.id] || "").trim()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        <FileSignature className="h-4 w-4" /> Terbitkan IA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-stone-400">Belum ada data IA yang menunggu diterbitkan.</div>
      )}

      {issued.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Sudah diterbitkan — menunggu konfirmasi mahasiswa</p>
          {issued.map(i => (
            <p key={i.id} className="mt-2 text-xs text-stone-600">
              <FileText className="mr-1 inline h-3 w-3 text-emerald-600" />
              <a href={`/ia/${i.id}`} target="_blank" rel="noreferrer" className="mr-2 font-semibold text-emerald-700 hover:underline">{i.activityCode || i.title}</a>
              — IA {i.iaNumber}
              {i.iaLanguage === "EN" && <span className="ml-1 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-bold text-blue-700">EN</span>}
              {i.iaUrl && <> · <a href={i.iaUrl} target="_blank" rel="noreferrer" className="mr-1 text-emerald-700 hover:underline"><Link2 className="mr-0.5 inline h-3 w-3" />Dokumen Drive</a></>}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
