import Link from "next/link";
import { db } from "@/lib/db";
import { Users, Activity, Globe2, MapPin, ArrowRight, Sparkles, FileText, Clock3, Building2 } from "lucide-react";
import KpiCard from "@/components/kpi-card";
import PartnerCard, { type PartnerLite } from "@/components/partner-card";
import ActivityCard, { type ActivityLite } from "@/components/activity-card";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [partners, activities, fields] = await Promise.all([
    db.partner.findMany({
      where: { status: "APPROVED" },
      include: { cooperationFields: { include: { cooperationField: true } }, agreements: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.activity.findMany({
      where: { status: "APPROVED" }, orderBy: { dateStart: "desc" }, take: 6,
      include: { partner: { select: { name: true, slug: true } } },
    }),
    db.cooperationField.findMany({ include: { partners: true } }),
  ]);

  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
  const usedPartnerIds = new Set(
    (await db.activity.findMany({ where: { status: "APPROVED", dateStart: { gte: sixMonthsAgo } }, select: { partnerId: true }, distinct: ["partnerId"] })).map(a => a.partnerId)
  );
  const counts = { LOKAL: 0, NASIONAL: 0, INTERNASIONAL: 0 };
  partners.forEach(p => { if (p.level in counts) counts[p.level as keyof typeof counts]++; });
  const partnerCards: PartnerLite[] = partners.slice(0, 6).map(p => ({
    id: p.id, slug: p.slug, name: p.name, level: p.level, category: p.category,
    city: p.city, country: p.country, utilizationLabel: usedPartnerIds.has(p.id) ? "Sudah ada Implementasi" : "Belum ada Implementasi",
    utilizationColor: usedPartnerIds.has(p.id) ? "green" : "yellow",
    fieldNames: p.cooperationFields.map(f => f.cooperationField.name),
  }));
  const activityCards: ActivityLite[] = activities.map(a => ({
    id: a.id, title: a.title, type: a.type, dateStart: a.dateStart,
    partnerName: a.partner.name, partnerSlug: a.partner.slug, location: a.location, photoUrl: a.photoUrl,
  }));
  return { total: partners.length, counts, used: usedPartnerIds.size, activities: await db.activity.count({ where: { status: "APPROVED" } }), partnerCards, activityCards, fields: fields.map(f => ({ name: f.name, count: f.partners.length })).sort((a,b) => b.count-a.count).slice(0, 5) };
}

export default async function Home() {
  const data = await getDashboardData();
  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-50/70 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-amber-50/70 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" /> Portal Kerja Sama THP · UNEJ
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
              Membangun Kemitraan,<br />
              <span className="text-emerald-700">Menguatkan Kolaborasi,</span><br />
              Menciptakan Dampak.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-500 sm:text-lg">
              Pusat data pemetaan dan dokumentasi kerja sama Teknologi Hasil Pertanian dalam satu platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/mitra" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-700/20 transition-colors hover:bg-emerald-800">
                Jelajahi Mitra <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/kegiatan" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-emerald-200 hover:text-emerald-700">
                + Laporkan Kegiatan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 pb-14">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total Mitra" value={data.total} icon={Users} />
          <KpiCard label="Sudah ada Implementasi (6 bulan)" value={data.used} icon={Activity} color="emerald" />
          <KpiCard label="Belum ada Implementasi" value={data.total - data.used} icon={Clock3} color="yellow" />
          <KpiCard label="Kegiatan Terdokumentasi" value={data.activities} icon={FileText} color="blue" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 pb-20">
        {/* Utilization + Level */}
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-start justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Ringkasan</p><h2 className="mt-1 text-xl font-bold text-stone-900">Implementasi Mitra</h2></div>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-4">
              <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-stone-600">Sudah ada Implementasi</span><span className="font-bold text-emerald-700">{data.used}</span></div><div className="h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${data.total ? (data.used/data.total)*100 : 0}%` }} /></div></div>
              <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-stone-600">Belum ada Implementasi</span><span className="font-bold text-amber-700">{data.total - data.used}</span></div><div className="h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${data.total ? ((data.total-data.used)/data.total)*100 : 0}%` }} /></div></div>
            </div>
            <Link href="/mitra?status=unused" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Lihat mitra belum ada implementasi <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Sebaran</p><h2 className="mt-1 text-xl font-bold text-stone-900">Jelajahi Berdasarkan Level</h2></div><Globe2 className="h-5 w-5 text-stone-400" /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {([['LOKAL','Lokal',MapPin,'emerald'],['NASIONAL','Nasional',BuildingIcon,'blue'],['INTERNASIONAL','Internasional',Globe2,'purple']] as const).map(([key, label, Icon, color]) => (
                <Link key={key} href={`/mitra?level=${key}`} className="group rounded-xl border border-stone-100 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30"><Icon className={`mb-3 h-7 w-7 ${color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`} /><p className="font-semibold text-stone-900">{label}</p><p className="mt-1 text-sm text-stone-500">{data.counts[key]} mitra</p><ArrowRight className="mt-3 h-4 w-4 text-stone-300 group-hover:text-emerald-600" /></Link>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section>
          <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Database Terbaru</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Mitra Terbaru</h2></div><Link href="/mitra" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Lihat semua <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.partnerCards.slice(0, 6).map(p => <PartnerCard key={p.id} partner={p} />)}</div>
        </section>

        {/* Activities */}
        <section>
          <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Kolaborasi</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Kegiatan Terbaru</h2></div><Link href="/kegiatan" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Lihat semua <ArrowRight className="h-4 w-4" /></Link></div>
          {data.activityCards.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.activityCards.map(a => <ActivityCard key={a.id} activity={a} />)}</div> : <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center"><Activity className="mx-auto h-8 w-8 text-stone-300" /><p className="mt-3 font-medium text-stone-600">Belum ada kegiatan terdokumentasi</p><p className="mt-1 text-sm text-stone-400">Jadilah yang pertama melaporkan kegiatan kolaborasi.</p><Link href="/kegiatan" className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Laporkan Kegiatan</Link></div>}
        </section>

        {/* CTA */}
        <section className="overflow-hidden rounded-2xl bg-emerald-800 px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Punya kegiatan kerja sama?</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-emerald-100">Bantu kami mendokumentasikan kolaborasi dan memperkaya data Taskforce Kerja Sama.</p></div><Link href="/kegiatan" className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50">+ Laporkan Kegiatan</Link></div>
        </section>
      </div>
    </div>
  );
}

function BuildingIcon(props: React.ComponentProps<typeof Building2>) { return <Building2 {...props} />; }
