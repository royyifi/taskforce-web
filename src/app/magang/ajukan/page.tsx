"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Handshake, ImagePlus, Plus, Send, Trash2, Upload } from "lucide-react";

interface Partner { id: string; name: string; slug: string; level: string }

type Step = 1 | 2 | 3 | 4 | 5;

export default function AjukanPage() {
  const [step, setStep] = useState<Step>(1);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);

  const [identity, setIdentity] = useState({ name: "", nim: "", prodi: "", email: "", phone: "" });
  const [activityType, setActivityType] = useState("MAGANG");
  const [activity, setActivity] = useState({ title: "", description: "", goal: "", dateStart: "", dateEnd: "", location: "", participantCount: "" });
  const [dosen, setDosen] = useState("");
  const [partnersPIC, setPartnerPIC] = useState({ name: "", position: "", phone: "", email: "" });
  const [students, setStudents] = useState<string[]>([""]);

  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/admin/partners").then(r => r.json()).then(d => setPartners(d.partners || [])); }, []);

  const filteredPartners = partners.filter(p => p.name.toLowerCase().includes(partnerQuery.toLowerCase()));
  const setI = (k: keyof typeof identity, v: string) => setIdentity(p => ({ ...p, [k]: v }));
  const setA = (k: keyof typeof activity, v: string) => setActivity(p => ({ ...p, [k]: v }));
  const setPIC = (k: keyof typeof partnersPIC, v: string) => setPartnerPIC(p => ({ ...p, [k]: v }));
  function addStudent() { setStudents(p => [...p, ""]); }

  async function submit() {
    setState("loading"); setMessage("");
    const body = {
      partnerId: selectedPartner?.id, activityType, title: activity.title, description: activity.description, goal: activity.goal,
      dateStart: activity.dateStart || undefined, dateEnd: activity.dateEnd || undefined, location: activity.location || undefined,
      participantCount: Number(activity.participantCount) || 0,
      participants: students.filter(Boolean).map((name, i) => ({ name, role: "MAHASISWA", order: i })),
      dosenName: dosen || undefined, partnerPIC: partnersPIC.name || undefined, partnerPICPosition: partnersPIC.position || undefined,
      partnerPICPhone: partnersPIC.phone || undefined, partnerPICEmail: partnersPIC.email || undefined,
      submitterName: identity.name, submitterNim: identity.nim, submitterEmail: identity.email,
      prodi: identity.prodi, submitterPhone: identity.phone,
    };
    const res = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setMessage(data.message || data.error);
    setState(res.ok ? "success" : "error");
  }

  if (state === "success") return <div className="mx-auto max-w-xl px-4 py-20 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 text-2xl font-bold text-stone-900">Pengajuan berhasil dikirim</h1><p className="mt-2 text-stone-500">{message}</p><Link href="/magang" className="mt-7 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Kembali ke Magang</Link></div>;

  const stepTitle = ["Data Diri", "Mitra", "Kegiatan", "Ringkasan", "Selesai"][step - 1];

  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link href="/magang" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali ke Magang</Link>
        <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Form pengajuan</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Ajukan Kegiatan</h1><p className="mt-2 text-stone-500">Isi data diri, pilih mitra, dan tentukan detail kegiatan yang akan dilakukan.</p></div>

        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">{([1,2,3,4] as Step[]).map(s => <span key={s} className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2.5 text-xs font-bold ${s === step ? "bg-emerald-700 text-white" : s < step ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>{s}</span>)}</div>
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-stone-800">{stepTitle}</h2>

        {step === 1 && <section className="space-y-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
          <Field label="Nama lengkap *" value={identity.name} onChange={v => setI("name", v)} placeholder="Nama sesuai KTP" />
          <Field label="NIM *" value={identity.nim} onChange={v => setI("nim", v)} placeholder="NIM mahasiswa" />
          <Field label="Program Studi *" value={identity.prodi} onChange={v => setI("prodi", v)} placeholder="Contoh: Teknologi Hasil Pertanian" />
          <Field label="Email" type="email" value={identity.email} onChange={v => setI("email", v)} />
          <Field label="Nomor HP" value={identity.phone} onChange={v => setI("phone", v)} />
          <div className="flex justify-end"><button onClick={() => setStep(2)} disabled={!identity.name || !identity.nim || !identity.prodi} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lanjut <ArrowRight className="h-4 w-4" /></button></div>
        </section>}

        {step === 2 && <section className="space-y-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
          <div><label className="mb-1.5 block text-sm font-medium text-stone-700">Pilih mitra *</label><input value={partnerQuery} onChange={e => { setPartnerQuery(e.target.value); setSelectedPartner(null); setPartnerSearchOpen(true); }} onFocus={() => setPartnerSearchOpen(true)} placeholder="Ketik nama mitra..." className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400" /></div>
          {partnerSearchOpen && !selectedPartner && filteredPartners.length > 0 && <div className="max-h-40 overflow-auto rounded-xl border border-stone-100 bg-white p-1 shadow">{filteredPartners.slice(0, 10).map(p => <button key={p.id} onClick={() => { setSelectedPartner(p); setPartnerQuery(p.name); setPartnerSearchOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700">{p.name} <span className="ml-2 text-xs text-stone-400">{p.level}</span></button>)}</div>}
          {selectedPartner && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-stone-900">{selectedPartner.name}</p><p className="mt-1 text-xs text-stone-500">Mitra ini sudah terdaftar di database Portal THP.</p><div className="mt-3 rounded-lg bg-white p-3 text-xs text-stone-600">Status: Mitra terdaftar — silakan lanjutkan pengajuan.</div></div>}
          {!selectedPartner && partnerQuery && filteredPartners.length === 0 && <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">Mitra tidak ditemukan. <Link href="/usulkan" className="ml-2 font-semibold text-emerald-700 hover:text-emerald-800">Usulkan Mitra Baru →</Link></div>}
          <div className="flex justify-between"><button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">Kembali</button><button onClick={() => setStep(3)} disabled={!selectedPartner} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lanjut <ArrowRight className="h-4 w-4" /></button></div>
        </section>}

        {step === 3 && <section className="space-y-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
          <div><label className="mb-1.5 block text-sm font-medium text-stone-700">Jenis kegiatan *</label><select value={activityType} onChange={e => setActivityType(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"><option value="MAGANG">Magang / MBKM</option><option value="PRAKTIKUM">Praktikum</option><option value="PENELITIAN">Penelitian</option><option value="TUGAS_AKHIR">Tugas Akhir</option><option value="PENGABDIAN">Pengabdian</option><option value="KUNJUNGAN">Kunjungan</option><option value="PENDIDIKAN">Pendidikan</option><option value="LAINNYA">Kegiatan Lainnya</option></select></div>
          <Field label="Judul kegiatan *" value={activity.title} onChange={v => setA("title", v)} placeholder="Contoh: Magang MBKM pada bagian Quality Control" />
          <Field label="Deskripsi singkat" value={activity.description} onChange={v => setA("description", v)} placeholder="Uraian singkat kegiatan" multiline />
          <Field label="Tujuan kegiatan" value={activity.goal} onChange={v => setA("goal", v)} placeholder="Tujuan dari kegiatan ini" multiline />
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal mulai *" type="date" value={activity.dateStart} onChange={v => setA("dateStart", v)} /><Field label="Tanggal selesai *" type="date" value={activity.dateEnd} onChange={v => setA("dateEnd", v)} /></div>
          <Field label="Lokasi kegiatan" value={activity.location} onChange={v => setA("location", v)} placeholder="Contoh: Kantor BRIN Cibinong, Jawa Barat" />
          <Field label="Jumlah peserta" type="number" value={activity.participantCount} onChange={v => setA("participantCount", v)} placeholder="0" />
          <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Dosen pendamping</p><Field label="Nama dosen / DPL" value={dosen} onChange={setDosen} placeholder="Nama lengkap dan gelar" /></div>
          <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">PIC dari mitra (jika diketahui)</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Nama PIC" value={partnersPIC.name} onChange={v => setPIC("name", v)} /><Field label="Jabatan" value={partnersPIC.position} onChange={v => setPIC("position", v)} /><Field label="Email" value={partnersPIC.email} onChange={v => setPIC("email", v)} /><Field label="Telepon" value={partnersPIC.phone} onChange={v => setPIC("phone", v)} /></div></div>
          <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Peserta mahasiswa</p><div className="space-y-2">{students.map((s, i) => <div key={i} className="flex gap-2"><input value={s} onChange={e => setStudents(p => p.map((x, j) => j === i ? e.target.value : x))} placeholder="Nama mahasiswa" className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400" />{students.length > 1 && <button onClick={() => setStudents(p => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-stone-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>)}<button onClick={addStudent} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"><Plus className="h-3.5 w-3.5" /> Tambah Mahasiswa</button></div></div>
          <div className="flex justify-between"><button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">Kembali</button><button onClick={() => setStep(4)} disabled={!activity.title || !activity.dateStart || !activity.dateEnd} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lihat Ringkasan <ArrowRight className="h-4 w-4" /></button></div>
        </section>}

        {step === 4 && <section className="space-y-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
          <SummaryBlock title="Data Diri" items={[["Nama", identity.name], ["NIM", identity.nim], ["Program Studi", identity.prodi]]} />
          <SummaryBlock title="Mitra" items={[["Nama", selectedPartner?.name || "-"]]} />
          <SummaryBlock title="Kegiatan" items={[["Jenis", activityType], ["Judul", activity.title], ["Periode", `${activity.dateStart} — ${activity.dateEnd}`], ["Lokasi", activity.location || "-"], ["Peserta", students.filter(Boolean).length.toString()]]} />
          {state === "error" && <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{message}</div>}
          <div className="flex justify-between"><button onClick={() => setStep(3)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">Kembali</button><button disabled={state === "loading"} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" />{state === "loading" ? "Mengirim..." : "Kirim Pengajuan"}</button></div>
        </section>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, multiline = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" /> : <input required type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400" />}</label>;
}

function SummaryBlock({ title, items }: { title: string; items: [string, string][] }) {
  return <div className="rounded-xl border border-stone-100 bg-stone-50 p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">{title}</h3><div className="space-y-2">{items.map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span className="text-stone-500">{k}</span><span className="font-semibold text-stone-800 text-right">{v}</span></div>)}</div></div>;
}
