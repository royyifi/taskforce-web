"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, LogOut, CheckCircle2, XCircle, Clock3, Users, Activity, AlertCircle, RefreshCw, PencilLine, ChevronDown, ChevronRight, FileText, User, Building2, Calendar, MapPin, Link2, Send, ExternalLink, Eye, Image as ImageIcon, FileUp, X, Trash2 } from "lucide-react";
import TeamAdmin from "@/components/team-admin";
import AccountAdmin from "@/components/account-admin";
import ChangePassword from "@/components/change-password";
import ContentAdmin from "@/components/content-admin";
import { formatDateRange } from "@/lib/utils";

interface Stats { totalPartners:number; pendingPartners:number; pendingActivities:number; totalActivities:number; partnersUsed:number; partnersUnused:number; agreementsEndingSoon:number; partnersWithoutPic:number }
interface PendingPartner { id:string; name:string; level:string; category:string|null; createdAt:string; country:string|null; city:string|null; address:string|null; website:string|null; phone:string|null; email:string|null; picName:string|null; picPosition:string|null; picPhone:string|null; picEmail:string|null; cooperationFields:{code:string;name:string}[]; submitterName:string|null; submitterEmail:string|null; submitterUnit:string|null; reason:string|null }
interface PendingSubmission { id:string; activityCode:string|null; title:string; type:string; dateStart:string|null; dateEnd:string|null; location:string|null; description:string|null; goal:string|null; partnerName:string; partnerSlug:string; submittedBy:string|null; submittedEmail:string|null; submitterNim:string|null; submitterPhone:string|null; submitterUnit:string|null; dosenName:string|null; lecturers:string[]; partnerPic:string|null; partnerPICPosition:string|null; partnerPICPhone:string|null; partnerPICEmail:string|null; rkpStatus:string|null; rkpUrl:string|null; spmUrl:string|null; hasLogo:boolean; students:string[]; createdAt:string }
interface PendingActivity { id:string; title:string; type:string; partnerName:string; submittedBy:string|null; submittedEmail:string|null; submitterNim:string|null; submitterPhone:string|null; submitterUnit:string|null; dateStart:string|null; dateEnd:string|null; location:string|null; description:string|null; goal:string|null; output:string|null; unit:string|null; participants:number|null; partnerPic:string|null; partnerPICPosition:string|null; partnerPICPhone:string|null; partnerPICEmail:string|null; dosenName:string|null; lecturers:string[]; rkpUrl:string|null; spmUrl:string|null; students:string[]; createdAt:string }
interface PendingEdit { id:string; partnerId:string; partnerName:string; submitterName:string; submitterEmail:string; note:string|null; createdAt:string; changes:Record<string,string>; proposedFields:string|null }
interface CompletionItem { id:string; activityCode:string|null; title:string; partnerName:string; submittedBy:string|null; submitterUnit:string|null; dateStart:string|null; dateEnd:string|null; students:string[]; source:string|null; iaNumber:string|null; iaUrl:string|null; reportLink:string|null; photoUrl:string|null; hasReport:boolean; hasDocs:boolean; hasIa:boolean }

const FIELD_LABELS: Record<string,string> = { name:"Nama", level:"Level", category:"Kategori", address:"Alamat", phone:"Telepon", email:"Email", website:"Website", picName:"Nama PIC", picPosition:"Jabatan PIC", picPhone:"Telepon PIC", picEmail:"Email PIC", city:"Kota", country:"Negara" };

export default function AdminPage() {
  const [stats, setStats] = useState<Stats|null>(null);
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [activities, setActivities] = useState<PendingActivity[]>([]);
  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [completion, setCompletion] = useState<CompletionItem[]>([]);
  const [completionLinks, setCompletionLinks] = useState<Record<string, string>>({});
  const [completionPhotos, setCompletionPhotos] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string|null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvedPartnersList, setApprovedPartnersList] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data = await res.json();
    setStats(data.kpi);
    setPartners(data.pendingPartners || []);
    setSubmissions(data.pendingSubmissions || []);
    setActivities(data.pendingActivitiesList || []);
    setEdits(data.pendingEdits || []);
    setCompletion(data.completionActivities || []);
    setApprovedPartnersList(data.approvedPartners || []);
    fetch("/api/auth/session").then(r => r.json()).then(d => setRole(d.user?.role || ""));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function uploadCompletionPhoto(id: string, file: File) {
    setUploadingPhoto(id);
    const data = new FormData(); data.append("file", file);
    const res = await fetch("/api/activities/upload", { method: "POST", body: data });
    const result = await res.json();
    if (res.ok) setCompletionPhotos(p => ({ ...p, [id]: result.url }));
    else setError(result.error || "Upload foto gagal.");
    setUploadingPhoto(null);
  }

  async function completeActivity(item: CompletionItem) {
    const reportLink = (completionLinks[item.id] || item.reportLink || "").trim();
    const photoUrl = completionPhotos[item.id] || item.photoUrl || "";
    const res = await fetch("/api/admin/ia", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId: item.id, reportLink, photoUrl }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Gagal menandai selesai."); return; }
    load();
  }

  async function deletePartner(id: string, name: string) {
    if (!window.confirm(`Hapus mitra "${name}"? Data yang dihapus tidak dapat dikembalikan.`)) return;
    setError("");
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Mitra gagal dihapus."); return; }
    load();
  }

  async function action(url:string, body:object) {
    setError(""); const res = await fetch(url, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (!res.ok) { setError("Aksi tidak berhasil."); return; } load();
  }

  async function reviewSubmission(id:string, status:"APPROVED"|"REJECTED"|"REVISION_REQUESTED") {
    let note = "";
    if (status !== "APPROVED") { note = prompt(status === "REVISION_REQUESTED" ? "Catatan perbaikan yang diminta:" : "Alasan penolakan:") || ""; if (status === "REJECTED" && !note) return; }
    await action("/api/submissions", { id, status, reviewNote: note || null });
  }

  async function logout() { await fetch("/api/auth/logout", { method:"POST" }); window.location.href = "/"; }

  if (loading && !stats) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-50"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  return <div className="min-h-[calc(100vh-4rem)] bg-stone-50">
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5"><div><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h1 className="text-xl font-bold text-stone-900">Dashboard Admin</h1>{role === "SUPER_ADMIN" && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Super Admin</span>}{role === "TEAM_ADMIN" && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Admin Tim</span>}</div><p className="mt-1 text-sm text-stone-500">Kelola data dan verifikasi pengajuan Taskforce.</p></div><div className="flex items-center gap-2"><Link href="/" className="hidden rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 sm:inline-flex"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Portal Publik</Link><button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" /> Keluar</button></div></div></header>
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4">
        <span className="border-b-2 border-emerald-700 py-3 text-sm font-semibold text-emerald-700">Dashboard</span>
        <Link href="/admin/ia-management" className="border-b-2 border-transparent py-3 text-sm font-semibold text-stone-500 hover:text-stone-700">Pengelolaan IA & Laporan</Link>
      </div>
    </div>

    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Clock3} label="Pengajuan Pending" value={submissions.length} color="blue" />
        <Stat icon={Activity} label="Total Pending" value={stats?.pendingActivities || 0} color="amber" />
        <Stat icon={Users} label="Mitra Belum ada Implementasi" value={stats?.partnersUnused || 0} color="yellow" />
        <Stat icon={AlertCircle} label="PKS ≤ 90 Hari" value={stats?.agreementsEndingSoon || 0} color="red" />
      </section>

      {/* Section: Pengajuan Kegiatan dari Mahasiswa */}
      <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div>
            <h2 className="font-bold text-stone-900">Pengajuan Kegiatan</h2>
            <p className="mt-0.5 text-xs text-stone-500">Dari form Magang — perlu verifikasi data lengkap (RKP, dosen, PIC, mahasiswa)</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{submissions.length} pending</span>
        </div>
        {submissions.length ? <div className="divide-y divide-stone-100">{submissions.map(s => {
          const isExpanded = expandedId === s.id;
          const hasRkp = s.type !== "MAGANG" || Boolean(s.rkpUrl);
          const hasSpm = s.type !== "MAGANG" || Boolean(s.spmUrl);
          const hasLogo = s.hasLogo;
          const hasDosen = Boolean(s.lecturers.length || s.dosenName);
          const hasPic = Boolean(s.partnerPic);
          const hasStudents = s.students.length > 0;
          const allGood = hasRkp && hasSpm && hasLogo && hasDosen && hasPic && hasStudents;
          return <div key={s.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setExpandedId(isExpanded ? null : s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.activityCode && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{s.activityCode}</span>}
                    <p className="truncate text-sm font-semibold text-stone-800">{s.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{s.submittedBy || "-"}{s.submitterNim && ` · ${s.submitterNim}`}{s.submitterUnit && ` · ${s.submitterUnit}`} — {s.partnerName} — {new Date(s.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
              </button>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => reviewSubmission(s.id, "APPROVED")} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${allGood ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-stone-100 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700"}`}><CheckCircle2 className="h-3.5 w-3.5" /> {allGood ? "Setujui" : "Setujui Saja"}</button>
                <button onClick={() => reviewSubmission(s.id, "REVISION_REQUESTED")} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"><PencilLine className="h-3.5 w-3.5" /> Minta Perbaikan</button>
                <button onClick={() => reviewSubmission(s.id, "REJECTED")} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><XCircle className="h-3.5 w-3.5" /> Tolak</button>
              </div>
            </div>
            {isExpanded && <div className="ml-7 mt-4 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
              {/* Checklist kelengkapan */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Checklist Kelengkapan</p>
                <div className="space-y-1.5">
                  <CheckItem label="Dokumen RKP" ok={hasRkp} detail={hasRkp ? <a href={s.rkpUrl!} target="_blank" rel="noreferrer" className="ml-1 underline hover:text-emerald-700">Lihat RKP</a> : <span className="ml-1 font-semibold text-red-600">Belum diunggah</span>} />
                  <CheckItem label="Surat penerimaan magang" ok={hasSpm} detail={s.spmUrl ? <a href={s.spmUrl} target="_blank" rel="noreferrer" className="ml-1 underline hover:text-emerald-700">Lihat surat</a> : <span className="ml-1 font-semibold text-red-600">Belum diunggah</span>} />
                  <CheckItem label="Logo mitra (IA)" ok={hasLogo} detail={hasLogo ? "Terunggah" : <span className="ml-1 font-semibold text-red-600">Belum diunggah</span>} />
                  <CheckItem label="Dosen pendamping" ok={hasDosen} detail={s.lecturers.length ? s.lecturers.join(", ") : s.dosenName || <span className="ml-1 font-semibold text-red-600">Belum diisi</span>} />
                  <CheckItem label="PIC mitra" ok={hasPic} detail={s.partnerPic || <span className="ml-1 font-semibold text-red-600">Belum ada</span>} />
                  <CheckItem label="Data mahasiswa" ok={hasStudents} detail={`${s.students.length} orang`} />
                </div>
              </div>
              {/* Data pengaju */}
              <div className="grid gap-3 border-t border-stone-200 pt-3 sm:grid-cols-2">
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-stone-700">Data Pengaju</p>
                  <p><User className="mr-1 inline h-3 w-3 text-stone-400" />{s.submittedBy || "-"}{s.submitterNim && ` · NIM ${s.submitterNim}`}</p>
                  <p><Activity className="mr-1 inline h-3 w-3 text-stone-400" />{s.submitterUnit || "-"}</p>
                  {s.submitterPhone && <p>HP: {s.submitterPhone}</p>}
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-stone-700">Kegiatan</p>
                  <p><Calendar className="mr-1 inline h-3 w-3 text-stone-400" />{formatDateRange(s.dateStart, s.dateEnd)}</p>
                  <p><MapPin className="mr-1 inline h-3 w-3 text-stone-400" />{s.location || "-"}</p>
                  {(s.lecturers.length > 0 || s.dosenName) && <p>Dosen: {(s.lecturers.length ? s.lecturers : [s.dosenName!]).join(", ")}</p>}
                  {s.goal && <p>Tujuan: {s.goal}</p>}
                </div>
              </div>
              {/* PIC mitra */}
              {hasPic && <div className="border-t border-stone-200 pt-3 text-xs">
                <p className="mb-1 font-bold text-stone-700">PIC Mitra</p>
                <p><Building2 className="mr-1 inline h-3 w-3 text-stone-400" />{s.partnerPic}{s.partnerPICPosition && ` · ${s.partnerPICPosition}`}</p>
                {s.partnerPICPhone && <p>HP: {s.partnerPICPhone}</p>}
                {s.partnerPICEmail && <p>Email: {s.partnerPICEmail}</p>}
              </div>}
              {/* Daftar mahasiswa */}
              {s.students.length > 0 && <div className="border-t border-stone-200 pt-3 text-xs">
                <p className="mb-1 font-bold text-stone-700">Mahasiswa ({s.students.length})</p>
                <p className="text-stone-600">{s.students.join(", ")}</p>
              </div>}
            </div>}
          </div>;
        })}</div> : <Empty text="Tidak ada pengajuan kegiatan baru" />}
      </section>

      {/* Laporan Kegiatan: verifikasi laporan dan penyelesaian terpusat */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <div><h2 className="font-bold text-stone-900">Usulan Mitra Baru</h2><p className="mt-0.5 text-xs text-stone-500">Perlu ditinjau dan diverifikasi</p></div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{partners.length} pending</span>
          </div>
          {partners.length ? <div className="divide-y divide-stone-100">{partners.map(p => {
            const isPartnerExpanded = expandedPartnerId === p.id;
            return <div key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setExpandedPartnerId(isPartnerExpanded ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  {isPartnerExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />}
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-800">{p.name}</p><p className="mt-1 text-xs text-stone-400">{p.level} · {p.category || "-"}</p></div>
                </button>
                <div className="flex shrink-0 gap-1.5"><button onClick={() => action("/api/admin/approve", { id:p.id, status:"APPROVED" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Setujui</button><button onClick={() => action("/api/admin/approve", { id:p.id, status:"REJECTED", reviewNote:"Ditolak oleh admin" })} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><XCircle className="h-3.5 w-3.5" /> Tolak</button><button onClick={() => void deletePartner(p.id, p.name)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><X className="h-3.5 w-3.5" /> Hapus</button></div>
              </div>
              {isPartnerExpanded && <PartnerDetails partner={p} />}
            </div>;
          })}</div> : <Empty text="Tidak ada usulan mitra baru" />}
        </section>

        <section className="rounded-2xl border border-stone-100 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <div><h2 className="font-bold text-stone-900">Laporan Kegiatan</h2><p className="mt-0.5 text-xs text-stone-500">Verifikasi laporan dan penyelesaian kegiatan</p></div>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">{activities.length + completion.length} pending</span>
          </div>
          <div className="divide-y divide-stone-100">
            {activities.map(a => {
              const isActivityExpanded = expandedId === `manual-${a.id}`;
              return <div key={`pending-${a.id}`} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setExpandedId(isActivityExpanded ? null : `manual-${a.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {isActivityExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />}
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-800">{a.title}</p><p className="mt-1 truncate text-xs text-stone-400">{a.partnerName} · {a.submittedBy || "Anonim"}</p>{a.students.length > 0 && <p className="mt-1 truncate text-xs text-stone-500">Mahasiswa ({a.students.length}): {a.students.join(", ")}</p>}</div>
                  </button>
                  <div className="flex shrink-0 gap-1.5"><button onClick={() => action("/api/submissions", { id:a.id, status:"APPROVED" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Setujui</button><button onClick={() => action("/api/submissions", { id:a.id, status:"REJECTED", reviewNote:"Dokumentasi perlu dilengkapi" })} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><XCircle className="h-3.5 w-3.5" /> Tolak</button></div>
                </div>
                {isActivityExpanded && <ManualActivityDetails activity={a} />}
              </div>;
            })}
            {completion.map(item => {
              const reportLink = completionLinks[item.id] || item.reportLink || "";
              const photoUrl = completionPhotos[item.id] || item.photoUrl || "";
              const ready = (item.source === "IA_DIRECT" || item.hasReport) && Boolean(reportLink) && item.hasIa;
              const missing: string[] = [];
              if (item.source !== "IA_DIRECT" && !item.hasReport) missing.push("Laporan (belum dilaporkan)");
              if (!reportLink && !photoUrl) missing.push("Dokumentasi (link atau foto)");
              if (!item.hasIa) missing.push("IA");
              const hasAll = missing.length === 0;

              return <div key={`completion-${item.id}`} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800">{item.activityCode || item.title}</p>
                    <p className="mt-1 text-xs text-stone-400">{item.title} · {item.partnerName}</p>
                    <p className="mt-1 text-xs text-stone-500">{item.submittedBy || "Tim Kerja Sama"}{item.submitterUnit ? ` · ${item.submitterUnit}` : ""}</p>
                  </div>
                  {hasAll
                    ? <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Siap diselesaikan</span>
                    : <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Data kurang</span>
                  }
                </div>

                {/* Checklist */}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {item.source === "IA_DIRECT"
                    ? <CheckRow label="IA langsung" ok={true} />
                    : <CheckRow label="Laporan ada" ok={Boolean(item.hasReport)} />
                  }
                  <CheckRow label="Dokumentasi ada" ok={Boolean(reportLink || photoUrl)} />
                  <CheckRow label="IA ada" ok={Boolean(item.hasIa)} />
                </div>

                {/* Submitted documents — clickable preview */}
                <div className="mt-3 space-y-2">
                  {reportLink && <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                    <Link2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-[10px] font-medium text-stone-500">Dokumentasi:</span>
                    <a href={reportLink} target="_blank" rel="noreferrer" className="min-w-0 truncate text-xs font-semibold text-emerald-700 hover:underline">{reportLink}</a>
                    <ExternalLink className="h-3 w-3 shrink-0 text-emerald-500" />
                  </div>}
                  {photoUrl && <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                    <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-[10px] font-medium text-stone-500">Foto sampul:</span>
                    <a href={photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">Lihat foto <Eye className="h-3 w-3" /></a>
                  </div>}
                  {!reportLink && !photoUrl && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-xs text-amber-800">Belum ada dokumentasi.</span>
                  </div>}
                </div>

                {/* Missing data warning */}
                {!hasAll && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">Data belum lengkap:</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                    {missing.map(m => <li key={m}>{m}</li>)}
                  </ul>
                  <p className="mt-2 text-xs text-amber-600">Hubungi pengaju untuk melengkapi data sebelum menandai selesai.</p>
                </div>}

                {/* Complete button */}
                <button type="button" onClick={() => void completeActivity(item)} disabled={!ready || uploadingPhoto === item.id} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                  <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
                </button>
              </div>;
            })}
            {!activities.length && !completion.length && <Empty text="Tidak ada laporan kegiatan baru" />}
          </div>
        </section>
      </div>

      {/* Section: Usulan Perbaikan Data */}
      <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div><h2 className="font-bold text-stone-900">Usulan Perbaikan Data</h2><p className="mt-0.5 text-xs text-stone-500">Koreksi data mitra dari publik</p></div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">{edits.length} pending</span>
        </div>
        {edits.length ? <div className="divide-y divide-stone-100">{edits.map(e => <div key={e.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-semibold text-stone-800">{e.partnerName}</p><p className="mt-0.5 text-xs text-stone-400">Diusulkan oleh {e.submitterName} · {new Date(e.createdAt).toLocaleDateString("id-ID")}</p>{e.note && <p className="mt-1 text-xs italic text-stone-500">"{e.note}"</p>}</div>
            <div className="flex shrink-0 gap-1.5"><button onClick={() => action("/api/partner-edits/review", { id:e.id, status:"APPROVED" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Terapkan</button><button onClick={() => action("/api/partner-edits/review", { id:e.id, status:"REJECTED", reviewNote:"Perbaikan tidak sesuai" })} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><XCircle className="h-3.5 w-3.5" /> Tolak</button></div>
          </div>
          <div className="mt-3 space-y-1.5 rounded-xl bg-stone-50 p-3">
            {Object.entries(e.changes).map(([field, to]) => <div key={field} className="text-xs"><span className="font-semibold text-stone-600">{FIELD_LABELS[field] || field}:</span> <span className={to === "" ? "italic text-red-600" : "text-stone-400"}>{to === "" ? "(dikosongkan)" : String(to)}</span></div>)}
            {e.proposedFields && <div className="border-t border-stone-200 pt-2 text-xs"><span className="font-semibold text-stone-600">Potensi kerja sama:</span><div className="mt-1.5 flex flex-wrap gap-1.5">{(() => { try { const codes: string[] = JSON.parse(e.proposedFields); return codes.map(code => <span key={code} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">{COOP_LABELS[code] || code}</span>); } catch { return <span className="text-red-600">Data tidak valid</span>; } })()}</div></div>}
          </div>
        </div>)}</div> : <Empty text="Tidak ada usulan perbaikan data" />}
      </section>

      <ContentAdmin />
      <TeamAdmin />
      {role === "SUPER_ADMIN" && <AccountAdmin />}
      <ChangePassword />

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <h2 className="font-bold text-emerald-900">Perlu Perhatian</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Notice text={`${stats?.agreementsEndingSoon || 0} perjanjian akan berakhir dalam 90 hari`} />
          <Notice text={`${stats?.partnersWithoutPic || 0} mitra belum memiliki PIC`} />
          <Notice text={`${stats?.partnersUnused || 0} mitra belum ada implementasi dalam 6 bulan`} />
        </div>
      </section>
    </main>
  </div>;
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return <div className={`rounded-xl border p-3 ${ok ? "border-emerald-100 bg-emerald-50/60" : "border-stone-200 bg-stone-50"}`}><div className="flex items-center gap-2 text-xs font-semibold text-stone-700">{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="text-red-500">×</span>}{label}</div><p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">{ok ? "Terpenuhi" : "Belum tersedia"}</p></div>;
}

function Stat({ icon:Icon, label, value, color }: { icon:typeof Clock3; label:string; value:number; color:string }) {
  const c:Record<string,string>={amber:"bg-amber-50 text-amber-700",blue:"bg-blue-50 text-blue-700",yellow:"bg-yellow-50 text-yellow-700",red:"bg-red-50 text-red-700"};
  return <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c[color]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xl font-bold text-stone-900">{value}</p><p className="text-xs text-stone-500">{label}</p></div></div>;
}

function CheckItem({ label, ok, detail }: { label:string; ok:boolean; detail:React.ReactNode }) {
  return <div className="flex items-center gap-2 text-xs"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}</span><span className="font-medium text-stone-700">{label}:</span><span className="text-stone-600">{detail}</span></div>;
}

function Empty({ text }: { text:string }) {
  return <div className="px-5 py-12 text-center text-sm text-stone-400"><CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-stone-300" />{text}</div>;
}

function ManualActivityDetails({ activity }: { activity: PendingActivity }) {
  return <div className="ml-7 mt-4 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Detail Kegiatan</p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p><span className="font-semibold text-stone-600">Jenis:</span> {activity.type}</p>
        <p><Calendar className="mr-1 inline h-3 w-3 text-stone-400" /><span className="font-semibold text-stone-600">Periode:</span> {formatDateRange(activity.dateStart, activity.dateEnd)}</p>
        <p><MapPin className="mr-1 inline h-3 w-3 text-stone-400" /><span className="font-semibold text-stone-600">Lokasi:</span> {activity.location || "-"}</p>
        <p><span className="font-semibold text-stone-600">Unit:</span> {activity.unit || "-"}</p>
        <p><span className="font-semibold text-stone-600">Jumlah peserta:</span> {activity.participants ?? "-"}</p>
        <p><span className="font-semibold text-stone-600">Mitra:</span> {activity.partnerName}</p>
      </div>
      {activity.description && <p className="mt-3 text-xs"><span className="font-semibold text-stone-600">Deskripsi:</span> {activity.description}</p>}
      {activity.goal && <p className="mt-2 text-xs"><span className="font-semibold text-stone-600">Tujuan:</span> {activity.goal}</p>}
      {activity.output && <p className="mt-2 text-xs"><span className="font-semibold text-stone-600">Output:</span> {activity.output}</p>}
    </div>
    <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Data Pengaju</p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p><User className="mr-1 inline h-3 w-3 text-stone-400" />{activity.submittedBy || "-"}{activity.submitterNim && ` · NIM ${activity.submitterNim}`}</p>
        <p><span className="font-semibold text-stone-600">Unit:</span> {activity.submitterUnit || "-"}</p>
        {activity.submittedEmail && <p>Email: {activity.submittedEmail}</p>}
        {activity.submitterPhone && <p>HP: {activity.submitterPhone}</p>}
      </div>
    </div>
    {(activity.lecturers.length > 0 || activity.dosenName || activity.partnerPic) && <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Pelaksana dan PIC</p>
      {activity.lecturers.length > 0 ? <p className="text-xs">Dosen: {activity.lecturers.join(", ")}</p> : activity.dosenName && <p className="text-xs">Dosen: {activity.dosenName}</p>}
      {activity.partnerPic && <p className="mt-1 text-xs"><Building2 className="mr-1 inline h-3 w-3 text-stone-400" />{activity.partnerPic}{activity.partnerPICPosition && ` · ${activity.partnerPICPosition}`}</p>}
      {activity.partnerPICPhone && <p className="mt-1 text-xs">HP PIC: {activity.partnerPICPhone}</p>}
      {activity.partnerPICEmail && <p className="mt-1 text-xs">Email PIC: {activity.partnerPICEmail}</p>}
    </div>}
    <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Dokumen dan Mahasiswa</p>
      <div className="space-y-1.5 text-xs">
        <p>RKP: {activity.rkpUrl ? <a href={activity.rkpUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">Lihat dokumen</a> : "Belum diunggah"}</p>
        <p>Surat penerimaan: {activity.spmUrl ? <a href={activity.spmUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">Lihat surat</a> : "Belum diunggah"}</p>
        <p>Mahasiswa ({activity.students.length}): {activity.students.length ? activity.students.join(", ") : "-"}</p>
      </div>
    </div>
  </div>;
}

function Notice({ text }: { text:string }) {
  return <div className="rounded-xl bg-white/70 px-4 py-3 text-sm text-emerald-800">• {text}</div>;
}

const COOP_LABELS: Record<string,string> = { MG:"Magang", PD:"Pendidikan", PM:"Pengabdian Masyarakat", PN:"Penelitian", PP:"Pertukaran Pelajar", SPI:"Studi/Proyek Independen" };

function PartnerDetails({ partner }: { partner: PendingPartner }) {
  return <div className="ml-7 mt-4 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Informasi Mitra</p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="space-y-1.5">
          <p><span className="font-semibold text-stone-600">Level:</span> {partner.level}</p>
          <p><span className="font-semibold text-stone-600">Kategori:</span> {partner.category || "-"}</p>
          <p><span className="font-semibold text-stone-600">Negara:</span> {partner.country || "-"}</p>
          <p><span className="font-semibold text-stone-600">Kota:</span> {partner.city || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p><span className="font-semibold text-stone-600">Alamat:</span> {partner.address || "-"}</p>
          {partner.website && <p><Link2 className="mr-1 inline h-3 w-3 text-stone-400" />{partner.website}</p>}
          {partner.phone && <p><span className="font-semibold text-stone-600">Telepon:</span> {partner.phone}</p>}
          {partner.email && <p><span className="font-semibold text-stone-600">Email:</span> {partner.email}</p>}
        </div>
      </div>
    </div>
    {(partner.picName || partner.picPosition || partner.picPhone || partner.picEmail) && <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Kontak PIC</p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="space-y-1.5">
          <p><User className="mr-1 inline h-3 w-3 text-stone-400" />{partner.picName || "-"}</p>
          {partner.picPosition && <p><Building2 className="mr-1 inline h-3 w-3 text-stone-400" />{partner.picPosition}</p>}
        </div>
        <div className="space-y-1.5">
          {partner.picPhone && <p>HP: {partner.picPhone}</p>}
          {partner.picEmail && <p>Email: {partner.picEmail}</p>}
        </div>
      </div>
    </div>}
    {partner.cooperationFields.length > 0 && <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Potensi Kerja Sama</p>
      <div className="flex flex-wrap gap-1.5">{partner.cooperationFields.map(f => <span key={f.code} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">{COOP_LABELS[f.code] || f.name}</span>)}</div>
    </div>}
    <div className="border-t border-stone-200 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Data Pengusul</p>
      <div className="space-y-1.5 text-xs">
        <p><User className="mr-1 inline h-3 w-3 text-stone-400" />{partner.submitterName || "-"}</p>
        {partner.submitterUnit && <p><Activity className="mr-1 inline h-3 w-3 text-stone-400" />{partner.submitterUnit}</p>}
        {partner.submitterEmail && <p>Email: {partner.submitterEmail}</p>}
        {partner.reason && <p className="mt-2 italic text-stone-500">"{partner.reason}"</p>}
      </div>
    </div>
  </div>;
}
