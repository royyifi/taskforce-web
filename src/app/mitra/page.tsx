"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Users, ArrowRight, MapPin, Building2 } from "lucide-react";
import { cn, LEVEL_COLORS } from "@/lib/utils";
import type { PartnerLite } from "@/components/partner-card";
import PartnerCard from "@/components/partner-card";

const fallbackPartners: PartnerLite[] = [];

export default function MitraPage() {
  const [partners, setPartners] = useState<PartnerLite[]>(fallbackPartners);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partners").then(r => r.json()).then(d => setPartners(d.partners || [])).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => Array.from(new Set(partners.map(p => p.category).filter(Boolean))) as string[], [partners]);
  const filtered = useMemo(() => partners.filter(p => {
    const text = `${p.name} ${p.category || ""} ${p.city || ""} ${p.country || ""}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (level === "ALL" || p.level === level) && (category === "ALL" || p.category === category) && (status === "ALL" || (status === "USED" ? p.utilizationColor === "green" : p.utilizationColor === "yellow"));
  }), [partners, query, level, category, status]);

  return (
    <div className="bg-stone-50">
      <section className="border-b border-stone-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Database kerja sama</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Mitra Kerja Sama</h1><p className="mt-3 max-w-2xl text-stone-500">Jelajahi mitra kerja sama Teknologi Hasil Pertanian berdasarkan level, kategori, dan pemanfaatannya.</p></div></section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-8 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama mitra, kota, atau kategori..." className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></div><div className="flex flex-wrap gap-2"><select value={level} onChange={e => setLevel(e.target.value)} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-600 outline-none focus:border-emerald-400"><option value="ALL">Semua Level</option><option value="LOKAL">Lokal</option><option value="NASIONAL">Nasional</option><option value="INTERNASIONAL">Internasional</option></select><select value={category} onChange={e => setCategory(e.target.value)} className="h-11 max-w-[170px] rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-600 outline-none focus:border-emerald-400"><option value="ALL">Semua Kategori</option>{categories.map(c => <option key={c} value={c!}>{c}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-600 outline-none focus:border-emerald-400"><option value="ALL">Semua Pemanfaatan</option><option value="USED">Sudah Digunakan</option><option value="UNUSED">Belum Digunakan</option></select></div></div></div>
        <div className="mb-5 flex items-center justify-between"><p className="text-sm text-stone-500">Menampilkan <span className="font-semibold text-stone-800">{filtered.length}</span> mitra</p><span className="inline-flex items-center gap-1.5 text-xs text-stone-400"><SlidersHorizontal className="h-3.5 w-3.5" /> Filter aktif</span></div>
        {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-200" />)}</div> : filtered.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <PartnerCard key={p.id} partner={p} />)}</div> : <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center"><Users className="mx-auto h-10 w-10 text-stone-300" /><h2 className="mt-4 font-semibold text-stone-700">Mitra tidak ditemukan</h2><p className="mt-1 text-sm text-stone-400">Coba ubah kata kunci atau filter pencarian Anda.</p></div>}
      </div>
    </div>
  );
}
