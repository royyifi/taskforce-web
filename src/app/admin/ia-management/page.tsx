"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, LogOut, Search, FileDown, Eye, Download, Link2, Calendar, Users, BookOpen, RefreshCw, CheckCircle2, AlertCircle, X, FileText } from "lucide-react";
import IaDirectForm from "@/components/ia-direct-form";
import IaPublishingPanel from "@/components/ia-publishing-panel";

interface HistoryItem {
  id: string;
  activityCode: string | null;
  iaNumber: string | null;
  title: string;
  partnerName: string;
  partnerSlug: string;
  submittedBy: string | null;
  submitterNim: string | null;
  submitterUnit: string | null;
  submittedEmail: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  iaUrl: string | null;
  rkpUrl: string | null;
  spmUrl: string | null;
  reportLink: string | null;
  studentCount: number;
  lecturerCount: number;
  completedAt: string | null;
  source: string | null;
  students: string[];
  lecturers: string[];
}

export default function IaManagementPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editRkp, setEditRkp] = useState("");
  const [editSpm, setEditSpm] = useState("");
  const [editIa, setEditIa] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (yearFilter !== "all") params.set("year", yearFilter);
    const res = await fetch(`/api/admin/ia-history?${params}`);
    if (res.status === 401) { window.location.href = "/login"; return; }
    if (res.ok) {
      const d = await res.json();
      setItems(d.items || []);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [search, yearFilter]);

  function flash(text: string, type: "info" | "error" = "info") { setMessageType(type); setMessage(text); }

  function startEdit(item: HistoryItem) {
    setEditId(item.id);
    setEditRkp(item.rkpUrl || "");
    setEditSpm(item.spmUrl || "");
    setEditIa(item.iaUrl || "");
    setMessage("");
  }

  async function saveLinks() {
    if (!editId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/ia-history/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rkpUrl: editRkp, spmUrl: editSpm, iaUrl: editIa }),
    });
    const d = await res.json();
    if (res.ok) { flash("Link dokumen berhasil diperbarui."); setEditId(null); await load(); }
    else flash(d.error || "Gagal memperbarui link.", "error");
    setSaving(false);
  }

  async function downloadReport() {
    if (!reportFrom || !reportTo) { setReportMsg("Isi tanggal periode terlebih dahulu."); return; }
    setReportMsg("");
    const res = await fetch(`/api/admin/report?from=${reportFrom}&to=${reportTo}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setReportMsg(d.error || "Gagal membuat laporan.");
      return;
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const filename = disposition?.match(/filename="([^"]+)"/)?.[1] || "Laporan_Kerja_Sama.docx";
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    setReportMsg("Laporan berhasil diunduh.");
  }

  function logout() { fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }

  const years = Array.from(new Set(items.map(i => i.dateStart ? new Date(i.dateStart).getFullYear().toString() : "").filter(Boolean))).sort().reverse();

  const isEditing = editId !== null;
  const editingItem = items.find(i => i.id === editId);

  return <div className="min-h-[calc(100vh-4rem)] bg-stone-50">
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <h1 className="text-xl font-bold text-stone-900">Pengelolaan IA & Laporan</h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">Kelola dokumen IA, riwayat kegiatan, dan unduh laporan.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">
            <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> Dashboard
          </Link>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
            Keluar
          </button>
        </div>
      </div>
    </header>

    {/* Tab navigasi */}
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4">
        <Link href="/admin" className="border-b-2 border-transparent py-3 text-sm font-semibold text-stone-500 hover:text-stone-700">Dashboard</Link>
        <span className="border-b-2 border-emerald-700 py-3 text-sm font-semibold text-emerald-700">Pengelolaan IA & Laporan</span>
      </div>
    </div>

    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {message && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {messageType === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {message}
        </div>
      )}

      {/* Buat IA Langsung */}
      <IaDirectForm onDone={load} />

      {/* Penerbitan IA */}
      <IaPublishingPanel />

      {/* Download Laporan */}
      <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div>
            <h2 className="font-bold text-stone-900">Download Laporan</h2>
            <p className="mt-0.5 text-xs text-stone-500">Unduh laporan kegiatan kerja sama dalam format Word</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-stone-700">Dari tanggal</span>
            <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-stone-700">Sampai tanggal</span>
            <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm" />
          </label>
          <button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            <FileDown className="h-4 w-4" /> Download Laporan Word
          </button>
          {reportMsg && <p className="text-xs text-stone-500">{reportMsg}</p>}
        </div>
      </section>

      {/* Riwayat Kegiatan */}
      <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div>
            <h2 className="font-bold text-stone-900">Riwayat Kegiatan</h2>
            <p className="mt-0.5 text-xs text-stone-500">Semua kegiatan yang sudah diterbitkan IA-nya</p>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">{items.length} kegiatan</span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-5 py-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama kegiatan, mitra, atau nomor IA..."
              className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm"
          >
            <option value="all">Semua tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-stone-400" /></div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-stone-400">Tidak ada kegiatan ditemukan.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {items.map(item => (
              <div key={item.id} className="p-4">
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_430px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.activityCode && <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">{item.activityCode}</span>}
                      {item.iaNumber && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.iaNumber}</span>}
                      {item.completedAt && <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Selesai</span>}
                      {!item.completedAt && <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Aktif</span>}
                      {item.source === "IA_DIRECT" && <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">IA Langsung</span>}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-stone-800">{item.title}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{item.partnerName} · {item.dateStart ? new Date(item.dateStart).toLocaleDateString("id-ID") : "-"} — {item.dateEnd ? new Date(item.dateEnd).toLocaleDateString("id-ID") : "-"}</p>
                    <p className="mt-1 text-xs text-stone-500">Pengaju: <span className="font-semibold text-stone-700">{item.submittedBy || "Tim Kerja Sama"}</span>{item.submitterNim && ` · NIM ${item.submitterNim}`}{item.submitterUnit && ` · ${item.submitterUnit}`}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-400">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {item.studentCount} mahasiswa</span>
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {item.lecturerCount} dosen</span>
                      {item.rkpUrl && <a href={item.rkpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><FileText className="h-3 w-3" /> RKP</a>}
                      {item.spmUrl && <a href={item.spmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><FileText className="h-3 w-3" /> Surat penerimaan</a>}
                      {item.iaUrl && <a href={item.iaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><Link2 className="h-3 w-3" /> Link IA</a>}
                      {item.reportLink && <a href={item.reportLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><Link2 className="h-3 w-3" /> Dokumentasi</a>}
                    </div>
                  </div>
                  <div className="w-full space-y-2 lg:w-auto">
                    <DocumentRow label="RKP" url={item.rkpUrl} />
                    <DocumentRow label="Surat penerimaan" url={item.spmUrl} />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-36 shrink-0 text-xs font-semibold text-stone-600">Dokumen IA</span>
                      {item.iaNumber ? (
                        <>
                          <a href={`/ia/${item.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </a>
                          <a href={`/api/ia/${item.id}/docx`} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                            <Download className="h-3.5 w-3.5" /> Word
                          </a>
                          <button onClick={() => startEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                            <Link2 className="h-3.5 w-3.5" /> Edit Link
                          </button>
                        </>
                      ) : <span className="text-xs text-stone-400">Belum tersedia</span>}
                    </div>
                    <DocumentRow label="Dokumentasi kegiatan" url={item.reportLink} linkOnly />
                  </div>
                </div>

                {/* Edit panel */}
                {editId === item.id && (
                  <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-amber-800">Edit Link Dokumen</p>
                      <button onClick={() => setEditId(null)} className="text-stone-400 hover:text-stone-700"><X className="h-4 w-4" /></button>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-700">Link RKP</span>
                      <input value={editRkp} onChange={e => setEditRkp(e.target.value)} placeholder="https://..." className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-700">Link Surat Penerimaan Magang</span>
                      <input value={editSpm} onChange={e => setEditSpm(e.target.value)} placeholder="https://..." className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-700">Link Dokumen IA (Google Drive)</span>
                      <input value={editIa} onChange={e => setEditIa(e.target.value)} placeholder="https://drive.google.com/..." className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => void saveLinks()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-emerald-800">
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                      <button onClick={() => setEditId(null)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">Batal</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  </div>;
}

function DocumentRow({ label, url, linkOnly = false }: { label: string; url: string | null; linkOnly?: boolean }) {
  return <div className="flex flex-wrap items-center gap-1.5">
    <span className="w-36 shrink-0 text-xs font-semibold text-stone-600">{label}</span>
    {url ? <>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"><Eye className="h-3.5 w-3.5" /> Preview</a>
      {!linkOnly && <a href={url} download className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Download className="h-3.5 w-3.5" /> Download</a>}
    </> : <span className="text-xs text-stone-400">Belum tersedia</span>}
  </div>;
}
