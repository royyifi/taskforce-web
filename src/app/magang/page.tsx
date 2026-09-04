import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, Download, FileText, GraduationCap, Handshake, Megaphone, Phone, Upload } from "lucide-react";

const services = [
  { icon: FileText, title: "Pengajuan Kegiatan", text: "Ajukan rencana magang atau kegiatan bersama mitra melalui satu formulir sederhana." },
  { icon: Handshake, title: "Pengecekan Mitra", text: "Lihat ketersediaan mitra dan dokumen kerja sama sebelum kegiatan diajukan." },
  { icon: BookOpen, title: "Dokumen IA", text: "Data pengajuan dapat digunakan untuk menyiapkan draft Implementation of Arrangement." },
  { icon: CheckCircle2, title: "Laporan Kegiatan", text: "Setelah selesai, laporkan kegiatan agar tercatat sebagai implementasi kerja sama." },
];

const programs = [
  { title: "Magang / MBKM", text: "Pengalaman belajar mahasiswa melalui kegiatan di mitra kerja sama." },
  { title: "Praktik Kerja", text: "Kegiatan praktik lapangan yang mendukung pembelajaran dan kompetensi mahasiswa." },
  { title: "Kegiatan Bersama Mitra", text: "Kegiatan lain yang melibatkan mitra dan memerlukan pencatatan kerja sama." },
];

export default function MagangPage() {
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
        <section>
          <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Program tersedia</p><h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Program Magang</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Kenali pilihan kegiatan yang dapat diajukan dan dikembangkan bersama mitra kerja sama THP.</p></div>
          <div className="grid gap-4 md:grid-cols-3">{programs.map((program) => <article key={program.title} className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><GraduationCap className="h-5 w-5" /></div><h3 className="mt-5 font-bold text-stone-900">{program.title}</h3><p className="mt-2 text-sm leading-relaxed text-stone-500">{program.text}</p><Link href="/magang/ajukan" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Ajukan kegiatan <ArrowRight className="h-4 w-4" /></Link></article>)}</div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pelayanan Program MBKM</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Ajukan kegiatan bersama mitra</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">Mahasiswa dapat mengajukan rencana kegiatan, memilih mitra yang tersedia, dan menyiapkan dokumen implementasi melalui Portal THP.</p></div><Link href="/magang/ajukan" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">AJUKAN KEGIATAN <ArrowRight className="h-4 w-4" /></Link></div>
        </section>

        <section><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Layanan</p><h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Bagaimana Portal THP membantu?</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm"><Icon className="h-6 w-6 text-emerald-600" /><h3 className="mt-4 font-bold text-stone-900">{title}</h3><p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p></article>)}</div></section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-stone-900">Panduan / Guidelines</h2></div><p className="mt-3 text-sm leading-relaxed text-stone-500">Pelajari ketentuan pengajuan dan pelaksanaan kegiatan magang sebelum mengisi formulir.</p><div className="mt-5 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"><Download className="h-4 w-4" /> Panduan Magang</button><button className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"><Download className="h-4 w-4" /> Template RKP</button></div></article>
          <article className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-stone-900">Pengumuman</h2></div><p className="mt-3 text-sm leading-relaxed text-stone-500">Informasi pendaftaran, ketentuan, dan pembaruan program magang akan ditampilkan di sini.</p><div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-stone-500"><CircleHelp className="mr-2 inline h-4 w-4 text-stone-400" /> Belum ada pengumuman terbaru.</div></article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pusat layanan</p><h2 className="mt-1 text-2xl font-bold text-stone-900">Butuh informasi lebih lanjut?</h2><p className="mt-2 text-sm text-stone-500">Hubungi Tim MBKM THP untuk informasi program dan proses pengajuan kegiatan.</p></div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Phone className="h-4 w-4" /> Layanan Tim MBKM THP</div></div></section>
      </main>
    </div>
  );
}
