import { db } from "@/lib/db";
import { Activity, Calendar, Building2, ArrowRight, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KegiatanPage() {
  const activities = await db.activity.findMany({
    where: { status: "APPROVED" },
    include: { partner: { select: { name: true, slug: true, level: true } } },
    orderBy: { dateStart: "desc" },
  });

  return (
    <div className="bg-stone-50">
      <section className="border-b border-stone-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Dokumentasi kolaborasi</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Kegiatan Kerja Sama</h1>
          <p className="mt-3 max-w-2xl text-stone-500">Kumpulan kegiatan kolaborasi Teknologi Hasil Pertanian bersama mitra yang telah diverifikasi.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-stone-500"><span className="font-semibold text-stone-800">{activities.length}</span> kegiatan terdokumentasi</p>
          <select className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"><option>Terbaru</option><option>Terlama</option></select>
        </div>

        {activities.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map(a => (
              <Link key={a.id} href={`/mitra/${a.partner.slug}`} className="group rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                <div className={`mb-4 flex h-32 items-center justify-center overflow-hidden rounded-xl ${a.photoUrl ? "bg-stone-100" : "bg-white"}`}><img src={a.photoUrl || "/logo-unej.png"} alt={`Foto kegiatan ${a.title}`} className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${a.photoUrl ? "object-cover" : "object-contain p-3"}`} /></div>
                <div className="flex items-start justify-between gap-2"><h2 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700">{a.title}</h2><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-600" /></div>
                {a.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">{a.description}</p>}
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Building2 className="h-3.5 w-3.5" /> {a.partner.name}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-500"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(a.dateStart)}</span><span className="rounded bg-stone-100 px-2 py-0.5">{a.type}</span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-stone-300" /><h2 className="mt-4 font-semibold text-stone-700">Belum ada kegiatan</h2><p className="mt-1 text-sm text-stone-400">Laporkan kegiatan kolaborasi pertama Anda.</p></div>
        )}

        <section className="mt-14 rounded-2xl bg-emerald-800 p-6 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Kontribusi dokumentasi</p><h2 className="mt-2 text-2xl font-bold">Punya kegiatan kerja sama yang belum tercatat?</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100">Laporkan kegiatan Anda. Setiap laporan akan ditinjau admin sebelum ditampilkan di portal publik.</p></div>
            <Link href="/laporkan" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Laporkan Kegiatan</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
