"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, X } from "lucide-react";

export default function ReportForm({ activityId, activityTitle, activityCode, partnerName }: { activityId: string; activityTitle: string; activityCode: string | null; partnerName: string }) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportSummary, setReportSummary] = useState("");
  const [reportLink, setReportLink] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function uploadPhoto(file: File) {
    setUploading(true);
    setMessage("");
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/activities/upload", { method: "POST", body: data });
    const result = await res.json();
    if (res.ok) setPhotoUrl(result.url);
    else { setPhotoUrl(""); setState("error"); setMessage(result.error || "Upload foto gagal."); }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportSummary.trim()) { setState("error"); setMessage("Ringkasan kegiatan wajib diisi."); return; }
    if (!photoUrl) { setState("error"); setMessage("Foto sampul kegiatan wajib diunggah."); return; }
    if (!reportLink.trim()) { setState("error"); setMessage("Link dokumentasi wajib diisi."); return; }
    setState("loading");
    const res = await fetch("/api/submissions/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, reportDate, reportSummary, reportLink, photoUrl }),
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/magang/kegiatan/${activityId}`;
    else { setState("error"); setMessage(data.error || "Gagal mengirim laporan."); }
  }

  return <div className="min-h-screen bg-stone-50"><div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <Link href={`/magang/kegiatan/${activityId}`} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali ke Status</Link>
    <div className="mt-7 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Laporan kegiatan</p>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{activityTitle}</h1>
      <p className="mt-1 text-sm text-stone-500">Nomor: {activityCode || "-"} · {partnerName}</p>
    </div>
    <form onSubmit={e => void submit(e)} className="mt-5 space-y-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-8">
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Tanggal pelaksanaan kegiatan</span><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Ringkasan kegiatan *</span><textarea required rows={4} value={reportSummary} onChange={e => setReportSummary(e.target.value)} placeholder="Uraikan pelaksanaan kegiatan, hasil, dan capaian." className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Foto sampul kegiatan <span className="text-red-600">*</span></span><div className="flex flex-wrap items-center gap-3"><input type="file" required accept="image/jpeg,image/png,image/webp" disabled={uploading || state === "loading"} onChange={e => e.target.files?.[0] && void uploadPhoto(e.target.files[0])} className="block min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm" />{photoUrl && <div className="relative"><img src={photoUrl} alt="Pratinjau foto" className="h-20 w-32 rounded-lg object-cover" /><button type="button" onClick={() => setPhotoUrl("")} className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"><X className="h-3.5 w-3.5" /></button></div>}</div></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Link dokumentasi <span className="text-red-600">*</span></span><input type="url" value={reportLink} onChange={e => setReportLink(e.target.value)} placeholder="https://drive.google.com/..." className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm" /></label>
      {state === "error" && <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}
      <div className="flex justify-end"><button type="submit" disabled={state === "loading" || uploading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" />{state === "loading" ? "Mengirim..." : "Kirim Laporan"}</button></div>
    </form>
  </div></div>;
}
