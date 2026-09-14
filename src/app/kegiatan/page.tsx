import { db } from "@/lib/db";
import { Calendar, Building2, ArrowRight, Plus, FileText, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KegiatanPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const selectedTab = tab === "riwayat" ? "riwayat" : "aktif";
  const activities = await db.activity.findMany({
    where: { status: "APPROVED" },
    include: { partner: { select: { name: true, slug: true, level: true } } },
    orderBy: { dateStart: "desc" },
  });
  const now = new Date();
  const isFinished = (a: { completedAt: Date | null }) => Boolean(a.completedAt);
  const active = activities.filter(a => !isFinished(a));
  const history = activities.filter(isFinished);
  const list = selectedTab === "aktif" ? active : history;

  return <div className="bg-stone-50">
    <section className="border-b border-stone-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Dokumentasi kolaborasi</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Kegiatan Kerja Sama</h1><p className="mt-3 max-w-2xl text-stone-500">Pantau kerja sama yang sedang berlangsung dan lihat riwayat kegiatan THP bersama mitra.</p></div></section>
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="inline-flex rounded-xl border border-stone-200 bg-white p-1"><Link href="/kegiatan?tab=aktif" className={`rounded-lg px-4 py-2 text-sm font-semibold ${selectedTab === "aktif" ? "bg-emerald-700 text-white" : "text-stone-500 hover:text-emerald-700"}`}>Aktif <span className="ml-1 text-xs opacity-75">{active.length}</span></Link><Link href="/kegiatan?tab=riwayat" className={`rounded-lg px-4 py-2 text-sm font-semibold ${selectedTab === "riwayat" ? "bg-emerald-700 text-white" : "text-stone-500 hover:text-emerald-700"}`}>Riwayat <span className="ml-1 text-xs opacity-75">{history.length}</span></Link></div><p className="text-sm text-stone-500"><span className="font-semibold text-stone-800">{list.length}</span> kegiatan {selectedTab === "aktif" ? "aktif" : "selesai"}</p></div>
      {list.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(a => <Link key={a.id} href={`/magang/kegiatan/${a.id}`} className="group rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"><div className="mb-4 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-white"><img src={a.photoUrl || "/logo-unej.png"} alt={`Foto kegiatan ${a.title}`} className={`h-full w-full ${a.photoUrl ? "object-cover" : "object-contain p-3"}`} /></div><div className="flex items-start justify-between gap-2"><div>{a.activityCode && <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">{a.activityCode}</p>}<h2 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700">{a.title}</h2></div><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-600" /></div><p className="mt-2 flex items-center gap-1.5 text-xs text-stone-600"><User className="h-3.5 w-3.5 text-stone-400" />{a.submittedBy || "Pengaju belum dicatat"}{a.submitterUnit && ` · ${a.submitterUnit}`}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Building2 className="h-3.5 w-3.5" />{a.partner.name}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(a.dateStart)}{a.dateEnd && ` — ${formatDate(a.dateEnd)}`}</span>{isFinished(a) && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-600"><CheckCircle2 className="h-3 w-3" /> Selesai</span>}</div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-stone-300" /><h2 className="mt-4 font-semibold text-stone-700">Belum ada kegiatan {selectedTab === "aktif" ? "aktif" : "selesai"}</h2><p className="mt-1 text-sm text-stone-400">{selectedTab === "aktif" ? "Kegiatan yang telah disetujui akan tampil di sini." : "Kegiatan selesai akan masuk ke riwayat."}</p></div>}
      <section className="mt-14 rounded-2xl bg-emerald-800 p-6 text-white sm:p-10"><div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Kontribusi dokumentasi</p><h2 className="mt-2 text-2xl font-bold">Punya kegiatan kerja sama yang belum tercatat?</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100">Laporkan kegiatan Anda. Setiap laporan akan ditinjau admin sebelum ditampilkan di portal publik.</p></div><Link href="/laporkan" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Laporkan Kegiatan</Link></div></section>
    </div>
  </div>;
}
