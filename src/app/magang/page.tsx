import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, Download, FileText, GraduationCap, Handshake, Megaphone, Phone, Upload, User, Building2, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const services = [
  { icon: FileText, title: "Pengajuan Kegiatan", text: "Ajukan rencana magang atau kegiatan bersama mitra melalui satu formulir sederhana." },
  { icon: Handshake, title: "Pengecekan Mitra", text: "Lihat ketersediaan mitra dan dokumen kerja sama sebelum kegiatan diajukan." },
  { icon: BookOpen, title: "Dokumen IA", text: "Data pengajuan dapat digunakan untuk menyiapkan draft Implementation of Arrangement." },
  { icon: CheckCircle2, title: "Laporan Kegiatan", text: "Setelah selesai, laporkan kegiatan agar tercatat sebagai implementasi kerja sama." },
];

function statusOf(a: { status: string; reportDate: Date | null; dateStart: Date | null; dateEnd: Date | null; completedAt: Date | null }) {
  const now = new Date();
  if (a.status === "PENDING") return { label: "Menunggu Verifikasi", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  if (a.status === "REVISION_REQUESTED") return { label: "Perlu Perbaikan", cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-300" };
  if (a.status === "REJECTED") return { label: "Ditolak", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" };
  if (a.completedAt) return { label: "Selesai", cls: "bg-stone-100 text-stone-600" };
  if (a.dateStart && a.dateStart <= now) return { label: "Sedang Berlangsung", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "Disetujui", cls: "bg-blue-50 text-blue-700" };
}

async function getContents() {
  return db.portalContent.findMany({ where: { published: true }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] });
}

async function getActiveActivities() {
  const rows = await db.activity.findMany({
    where: { status: { in: ["PENDING", "REVISION_REQUESTED", "APPROVED"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { partner: { select: { name: true, slug: true } } },
  });
  const now = new Date();
  // Kegiatan yang sudah selesai tidak ditampilkan di sini — masuk ke halaman Kegiatan.
  return rows.filter(a => !a.completedAt).slice(0, 6);
}

export default async function MagangPage() {
  const activities = await getActiveActivities();
  const contents = await getContents();
  const guides = contents.filter(c => c.kind === "GUIDE" || c.kind === "TEMPLATE");
  const announcements = contents.filter(c => c.kind === "ANNOUNCEMENT");
  return (
    <div className="bg-stone-50">
      <section className="relative overflow-hidden bg-emerald-800 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-600/40 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-700/50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100"><GraduationCap className="h-4 w-4" /> Program Magang THP</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Kampus Berdampak,<br /><span className="text-emerald-200">Membangun Pengalaman.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-100 sm:text-lg">Ruang informasi dan pengajuan kegiatan magang mahasiswa Teknologi Hasil Pertanian bersama mitra.</p>
            <Link href="/magang/ajukan" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50">Ajukan Kegiatan <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-14 px-4 py-14 sm:py-16">
        <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pemantauan Kegiatan</p><h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Kerja Sama yang Sedang Berlangsung</h2><p className="mt-2 text-sm text-stone-500">Pantau aktivitas THP bersama mitra kerja sama.</p></div><Link href="/kegiatan" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Lihat semua <ArrowRight className="h-4 w-4" /></Link></div>
          {activities.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{activities.map(a => { const status = statusOf(a); return <Link key={a.id} href={`/magang/kegiatan/${a.id}`} className="group rounded-xl border border-stone-100 p-4 transition-all hover:border-emerald-200 hover:shadow-sm"><div className="flex items-start justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">{a.activityCode || "Kegiatan"}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>{status.label}</span></div><h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-stone-900 group-hover:text-emerald-700">{a.title}</h3><div className="mt-3 space-y-1.5 text-xs text-stone-500"><p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {a.submittedBy || "Pengaju belum dicatat"}{a.submitterUnit && ` · ${a.submitterUnit}`}</p><p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {a.partner.name}</p><p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(a.dateStart)}{a.dateEnd && ` — ${formatDate(a.dateEnd)}`}</p></div></Link> })}</div> : <div className="rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-500">Belum ada kegiatan yang berlangsung.</div>}
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pelayanan Program MBKM</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Ajukan kegiatan bersama mitra</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">Mahasiswa dapat mengajukan rencana kegiatan, memilih mitra yang tersedia, dan menyiapkan dokumen implementasi melalui Portal THP.</p></div><Link href="/magang/ajukan" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">AJUKAN KEGIATAN <ArrowRight className="h-4 w-4" /></Link></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-stone-900">Panduan / Guidelines</h2></div><p className="mt-3 text-sm leading-relaxed text-stone-500">Pelajari ketentuan pengajuan dan pelaksanaan kegiatan magang sebelum mengisi formulir.</p><div className="mt-5 space-y-2">{guides.length ? guides.slice(0, 6).map(c => c.fileUrl ? <a key={c.id} href={c.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2.5 text-sm font-semibold text-stone-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><span className="min-w-0 truncate">{c.title}</span><Download className="ml-3 h-4 w-4 shrink-0" /></a> : null) : <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">Belum ada panduan atau template.</p>}</div></article>
          <article className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-stone-900">Pengumuman</h2></div><p className="mt-3 text-sm leading-relaxed text-stone-500">Informasi pendaftaran, ketentuan, dan pembaruan program magang akan ditampilkan di sini.</p><div className="mt-5 space-y-3">{announcements.length ? announcements.slice(0, 5).map(c => <article key={c.id} className="rounded-xl bg-stone-50 p-4"><p className="font-semibold text-stone-800">{c.title}</p>{c.summary && <p className="mt-1 text-sm text-stone-500">{c.summary}</p>}<p className="mt-2 text-[11px] text-stone-400">{c.publishedAt ? formatDate(new Date(c.publishedAt)) : formatDate(new Date(c.createdAt))}</p>{c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">Buka lampiran <Download className="h-3.5 w-3.5" /></a>}</article>) : <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500"><CircleHelp className="mr-2 inline h-4 w-4 text-stone-400" /> Belum ada pengumuman terbaru.</div>}</div></article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pusat layanan</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Butuh informasi lebih lanjut?</h2><p className="mt-2 text-sm text-stone-500">Hubungi Tim MBKM THP untuk informasi program dan proses pengajuan kegiatan.</p></div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Phone className="h-4 w-4" /> Layanan Tim MBKM THP</div></div></section>
      </main>
    </div>
  );
}
