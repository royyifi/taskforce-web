import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, Clock3, FileText, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import IaConfirm from "@/components/ia-confirm";
import ActivityAdminActions from "@/components/activity-admin-actions";

export const dynamic = "force-dynamic";

const stages = [
  ["PENGIRIMAN", "Pengajuan dikirim", "Pengajuan kegiatan berhasil dikirim."],
  ["VERIFIKASI", "Verifikasi Tim MBKM", "Tim memeriksa kelengkapan pengajuan."],
  ["DATA_LENGKAP", "Data lengkap", "Data kegiatan siap diproses."],
  ["IA_DITERBITKAN", "IA diterbitkan", "Unduh dokumen IA lalu konfirmasi penerimaan."],
  ["SIAP_BERANGKAT", "Siap berangkat", "Dokumen selesai dan menunggu tanggal mulai."],
  ["BERLANGSUNG", "Sedang berlangsung", "Kegiatan berjalan di lokasi mitra."],
  ["SELESAI", "Selesai", "Kegiatan selesai dan masuk riwayat implementasi."],
] as const;

function getStage(activity: { status: string; iaStatus: string | null; iaNumber: string | null; dateStart: Date | null; dateEnd: Date | null; reportDate: Date | null; iaConfirmedAt: Date | null; completedAt: Date | null; source: string | null }) {
  const now = new Date();
  if (activity.status === "REJECTED") return -1;
  if (activity.completedAt) return 6;
  if (activity.source === "IA_DIRECT") {
    if (activity.iaConfirmedAt || activity.iaNumber) return 5;
    if (activity.iaStatus === "DIAJUKAN" || activity.iaStatus === "REVISI") return 2;
    return 0;
  }
  if (activity.iaConfirmedAt) {
    if (activity.dateStart && activity.dateStart <= now) return 5;
    return 4;
  }
  if (activity.iaStatus === "DIAJUKAN" || activity.iaStatus === "REVISI") return 2;
  if (activity.iaNumber || activity.iaStatus === "DISETUJUI" || activity.iaStatus === "DITANDATANGANI") return 3;
  if (activity.status === "APPROVED") return 2;
  return 0;
}

function dateText(date: Date | null) {
  return date ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date) : "-";
}

export default async function ActivityStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await db.activity.findUnique({ where: { id }, select: { id: true, title: true, status: true, iaStatus: true, iaNumber: true, iaUrl: true, iaConfirmedAt: true, iaReviewNote: true, iaLanguage: true, dateStart: true, dateEnd: true, location: true, activityCode: true, reportDate: true, reportSummary: true, reportLink: true, rkpUrl: true, completedAt: true, reviewNote: true, source: true, partner: { select: { name: true, slug: true, city: true, address: true, picName: true, picPosition: true } }, students: { orderBy: { order: "asc" as const } } } });
  if (!activity) notFound();
  const session = await getSession();
  const isAdmin = Boolean(session && ["SUPER_ADMIN", "TEAM_ADMIN", "ADMIN"].includes(session.role));
  const current = getStage(activity);
  const currentLabel = current < 0 ? "Ditolak" : stages[Math.max(0, current)]?.[1] || "Pengajuan dikirim";

  return <div className="min-h-screen bg-stone-50"><div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <Link href="/magang" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali ke Magang</Link>
    <div className="mt-7 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Status kegiatan</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-stone-900">{activity.title}</h1><p className="mt-1 text-sm text-stone-500">Nomor Kegiatan: <strong className="text-emerald-700">{activity.activityCode || "Menunggu nomor"}</strong></p></div><div className="flex flex-col items-end gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${current < 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{current < 0 ? "Ditolak" : currentLabel}</span>{isAdmin && <ActivityAdminActions activityId={activity.id} activityName={activity.activityCode || activity.title} />}</div></div>
      <div className="mt-5 grid gap-3 border-t border-stone-100 pt-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-stone-400">Mitra</p><Link href={`/mitra/${activity.partner.slug}`} className="font-semibold text-stone-800 hover:text-emerald-700">{activity.partner.name}</Link></div><div><p className="text-xs text-stone-400">Periode</p><p className="font-semibold text-stone-800">{dateText(activity.dateStart)} — {dateText(activity.dateEnd)}</p></div></div>
    </div>

    {current < 0 ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-800"><strong>Pengajuan ditolak.</strong>{activity.reviewNote && <p className="mt-1">Catatan tim: {activity.reviewNote}</p>}</div> : <>
      {activity.status === "REVISION_REQUESTED" && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>Pengajuan perlu diperbaiki.</strong><p className="mt-1">Tim MBKM meminta perbaikan sebelum pengajuan dapat diverifikasi.</p>{activity.reviewNote && <p className="mt-3 rounded-lg bg-white/70 p-3">Catatan perbaikan: {activity.reviewNote}</p>}<Link href={`/magang/ajukan?perbaiki=${activity.id}`} className="mt-4 inline-flex items-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">Perbaiki Pengajuan</Link></div>}
      <div className="mt-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-8"><h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">Progres kegiatan</h2><div className="mt-6">{stages.map(([key, label, desc], index) => { const done = index < current; const active = index === current; return <div key={key} className="relative flex gap-4 pb-7 last:pb-0"><div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white ${done || active ? "border-emerald-600" : "border-stone-200"}`}><span className={done || active ? "text-emerald-600" : "text-stone-300"}>{done ? <Check className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}</span></div>{index < stages.length - 1 && <div className={`absolute left-[15px] top-8 h-full w-0.5 ${done ? "bg-emerald-300" : "bg-stone-200"}`} />}<div className="pt-0.5"><p className={`font-semibold ${active ? "text-emerald-700" : done ? "text-stone-700" : "text-stone-400"}`}>{label}{active && <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">Saat ini</span>}</p><p className={`mt-1 text-sm ${active || done ? "text-stone-500" : "text-stone-400"}`}>{desc}</p></div></div>; })}</div></div>
    </>}

    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-stone-100 bg-white p-5"><MapPin className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs text-stone-400">Lokasi kegiatan</p><p className="mt-1 text-sm font-semibold text-stone-800">{activity.location || "Belum ditentukan"}</p></div><div className="rounded-2xl border border-stone-100 bg-white p-5"><FileText className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs text-stone-400">Dokumen kegiatan</p>{activity.iaNumber ? <p className="mt-1 text-sm font-semibold text-stone-800">IA: {activity.iaNumber}</p> : <p className="mt-1 text-sm text-stone-500">IA belum diterbitkan</p>}{activity.rkpUrl && <a href={activity.rkpUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">Dokumen RKP <FileText className="h-3.5 w-3.5" /></a>}</div></div>
    {current === 2 && !activity.iaNumber && activity.iaStatus !== "REVISI" && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Data kegiatan lengkap</p><p className="mt-2 font-semibold text-stone-900">IA sedang diproses Tim Kerja Sama</p><p className="mt-1 text-sm text-stone-600">Data PIC, logo mitra, dan dokumen pengajuan telah diterima. Mahasiswa tidak perlu mengunggah atau mengisi data tambahan.</p></div>}
    {activity.iaStatus === "REVISI" && !activity.iaNumber && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>IA sedang diperiksa ulang oleh Tim Kerja Sama.</strong>{activity.iaReviewNote && <p className="mt-1">Catatan: {activity.iaReviewNote}</p>}</div>}
    {activity.iaNumber && <IaConfirm activityId={activity.id} iaNumber={activity.iaNumber} iaUrl={activity.iaUrl} confirmed={Boolean(activity.iaConfirmedAt)} />}

    {activity.reportDate && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Laporan kegiatan</p><p className="mt-2 text-sm font-semibold text-stone-800">Dilaporkan pada {dateText(activity.reportDate)}</p>{activity.reportSummary && <p className="mt-2 text-sm leading-relaxed text-stone-600">{activity.reportSummary}</p>}{activity.reportLink && <a href={activity.reportLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Dokumentasi kegiatan <FileText className="h-4 w-4" /></a>}</div>}
    {current === 5 && !activity.reportDate && <Link href={`/magang/kegiatan/${activity.id}/laporkan`} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-800">Laporkan Kegiatan</Link>}
  </div></div>;
}
