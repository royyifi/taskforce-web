"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Plus, Send, Trash2, FileUp, X, FileText } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  slug: string;
  level: string;
  picName: string | null;
  picPosition: string | null;
  picPhone: string | null;
  picEmail: string | null;
  logoFileId: string | null;
}

type Step = 1 | 2 | 3 | 4;

type Pic = { name: string; position: string; phone: string; email: string };

export default function AjukanPage() {
  const [step, setStep] = useState<Step>(1);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);
  const [identity, setIdentity] = useState({ name: "", nim: "", prodi: "", email: "", phone: "" });
  const [activityType, setActivityType] = useState("MAGANG");
  const [activity, setActivity] = useState({ title: "", description: "", goal: "", dateStart: "", dateEnd: "", location: "", participantCount: "" });
  const [dosens, setDosens] = useState<string[]>([""]);
  const [differentPic, setDifferentPic] = useState(false);
  const [overridePic, setOverridePic] = useState<Pic>({ name: "", position: "", phone: "", email: "" });
  const [students, setStudents] = useState<string[]>([""]);
  const [rkpUrl, setRkpUrl] = useState("");
  const [rkpName, setRkpName] = useState("");
  const [spmUrl, setSpmUrl] = useState("");
  const [spmName, setSpmName] = useState("");
  const [uploadingRkp, setUploadingRkp] = useState(false);
  const [uploadingSpm, setUploadingSpm] = useState(false);
  const [proposalLogoFileId, setProposalLogoFileId] = useState<string | null>(null);
  const [proposalLogoName, setProposalLogoName] = useState<string | null>(null);
  const [uploadingProposalLogo, setUploadingProposalLogo] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [revisionLoading, setRevisionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/partners").then(r => r.json()).then(d => setPartners(d.partners || []));
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("perbaiki");
    if (!id) return;
    setRevisionId(id); setRevisionLoading(true);
    fetch(`/api/submissions/${id}`).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Pengajuan tidak dapat dimuat.");
      setIdentity({ name: data.submittedBy || "", nim: data.submitterNim || "", prodi: data.submitterUnit || "", email: data.submittedEmail || "", phone: data.submitterPhone || "" });
      setSelectedPartner(data.partner); setPartnerQuery(data.partner.name);
      setActivityType(data.activityType || "MAGANG");
      setActivity({ title: data.title || "", description: data.description || "", goal: data.goal || "", dateStart: data.dateStart || "", dateEnd: data.dateEnd || "", location: data.location || "", participantCount: data.participantCount ? String(data.participantCount) : "" });
      setDosens(data.lecturers?.length ? data.lecturers : (data.dosenName ? [data.dosenName] : [""])); setStudents(data.students?.length ? data.students : [""]);
      const customPic = data.partnerPic && data.partnerPic !== data.partner.picName;
      setDifferentPic(Boolean(customPic)); setOverridePic({ name: data.partnerPic || "", position: data.partnerPICPosition || "", phone: data.partnerPICPhone || "", email: data.partnerPICEmail || "" });
            setRkpUrl(data.rkpUrl || ""); setRkpName(data.rkpUrl ? "RKP sebelumnya" : "");
      setSpmUrl(data.spmUrl || ""); setSpmName(data.spmUrl ? "Surat penerimaan sebelumnya" : "");
    }).catch(error => { setState("error"); setMessage(error instanceof Error ? error.message : "Pengajuan tidak dapat dimuat."); }).finally(() => setRevisionLoading(false));
  }, []);

  const filteredPartners = partners.filter(p => p.name.toLowerCase().includes(partnerQuery.toLowerCase()));
  const setI = (key: keyof typeof identity, value: string) => setIdentity(p => ({ ...p, [key]: value }));
  const setA = (key: keyof typeof activity, value: string) => setActivity(p => ({ ...p, [key]: value }));
  const setP = (key: keyof Pic, value: string) => setOverridePic(p => ({ ...p, [key]: value }));
  const choosePartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setPartnerQuery(partner.name);
    setPartnerSearchOpen(false);
    setDifferentPic(false);
  };

  async function uploadProposalLogo(file: File) {
    setUploadingProposalLogo(true); setMessage("");
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/activities/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url && data.fileId) {
      setProposalLogoFileId(data.fileId);
      setProposalLogoName(file.name);
    } else {
      setMessage(data.error || "Upload logo gagal.");
      setState("error");
    }
    setUploadingProposalLogo(false);
  }

  async function uploadRkp(file: File) {
    setUploadingRkp(true); setMessage("");
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/activities/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) { setRkpUrl(data.url); setRkpName(file.name); }
    else { setMessage(data.error || "Upload RKP gagal."); setState("error"); }
    setUploadingRkp(false);
  }

  async function uploadSpm(file: File) {
    setUploadingSpm(true); setMessage("");
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/activities/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) { setSpmUrl(data.url); setSpmName(file.name); }
    else { setMessage(data.error || "Upload surat penerimaan gagal."); setState("error"); }
    setUploadingSpm(false);
  }

  async function submit() {
    setState("loading"); setMessage("");
    const pic = differentPic ? overridePic : {
      name: selectedPartner?.picName || "",
      position: selectedPartner?.picPosition || "",
      phone: selectedPartner?.picPhone || "",
      email: selectedPartner?.picEmail || "",
    };
    const body = {
      partnerId: selectedPartner?.id, activityType, title: activity.title, description: activity.description, goal: activity.goal,
      dateStart: activity.dateStart, dateEnd: activity.dateEnd, location: activity.location, participantCount: Number(activity.participantCount) || 0,
      participants: students.filter(Boolean).map(name => ({ name, role: "MAHASISWA" })), dosenName: dosens.find(Boolean) || undefined, lecturers: dosens.filter(Boolean).map(name => ({ name })),
      partnerPIC: pic.name || undefined, partnerPICPosition: pic.position || undefined, partnerPICPhone: pic.phone || undefined, partnerPICEmail: pic.email || undefined,
      submitterName: identity.name, submitterNim: identity.nim, submitterEmail: identity.email, prodi: identity.prodi, submitterPhone: identity.phone,
      rkpUrl: rkpUrl || undefined, spmUrl: spmUrl || undefined, proposalLogoFileId: selectedPartner?.logoFileId ? undefined : proposalLogoFileId || undefined,
    };
    const res = await fetch(revisionId ? `/api/submissions/${revisionId}` : "/api/submissions", { method: revisionId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok && data.id) window.location.href = `/magang/kegiatan/${data.id}`;
    else { setMessage(data.message || data.error || "Pengajuan gagal dikirim."); setState("error"); }
  }

  return (
    <div className="bg-stone-50"><div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/magang" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali ke Magang</Link>
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Form pengajuan</p><h1 className="mt-2 text-3xl font-bold text-stone-900">{revisionId ? "Perbaiki Pengajuan" : "Ajukan Kegiatan"}</h1><p className="mt-2 text-stone-500">Isi data diri, pilih mitra, dan tentukan detail kegiatan yang akan dilakukan.</p></div>
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">{([1, 2, 3, 4] as Step[]).map(s => <span key={s} className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2.5 text-xs font-bold ${s === step ? "bg-emerald-700 text-white" : s < step ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>{s}</span>)}</div>
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-stone-800">{["Data Diri", "Mitra", "Kegiatan", "Ringkasan"][step - 1]}</h2>

      {revisionLoading && <div className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Memuat data pengajuan...</div>}

      {step === 1 && <section className="space-y-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6"><Field label="Nama lengkap *" value={identity.name} onChange={v => setI("name", v)} placeholder="Nama sesuai KTP" /><Field label="NIM *" value={identity.nim} onChange={v => setI("nim", v)} placeholder="NIM mahasiswa" /><Field label="Program Studi *" value={identity.prodi} onChange={v => setI("prodi", v)} placeholder="Contoh: Teknologi Hasil Pertanian" /><Field label="Email" type="email" value={identity.email} onChange={v => setI("email", v)} /><Field label="Nomor HP" value={identity.phone} onChange={v => setI("phone", v)} /><div className="flex justify-end"><button onClick={() => setStep(2)} disabled={!identity.name || !identity.nim || !identity.prodi} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lanjut <ArrowRight className="h-4 w-4" /></button></div></section>}

      {step === 2 && <section className="space-y-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6"><div><label className="mb-1.5 block text-sm font-medium text-stone-700">Pilih mitra *</label><input value={partnerQuery} onChange={e => { setPartnerQuery(e.target.value); setSelectedPartner(null); setPartnerSearchOpen(true); }} onFocus={() => setPartnerSearchOpen(true)} placeholder="Ketik nama mitra..." className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400" /></div>{partnerSearchOpen && !selectedPartner && filteredPartners.length > 0 && <div className="max-h-40 overflow-auto rounded-xl border border-stone-100 bg-white p-1 shadow">{filteredPartners.slice(0, 10).map(p => <button key={p.id} onClick={() => choosePartner(p)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700">{p.name} <span className="ml-2 text-xs text-stone-400">{p.level}</span></button>)}</div>}
        {selectedPartner && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-stone-900">{selectedPartner.name}</p><div className="mt-3 rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wider text-stone-500">PIC utama dari Master Mitra</p><p className="mt-1 text-sm font-semibold text-stone-800">{selectedPartner.picName || "Belum ada PIC"}</p>{selectedPartner.picPosition && <p className="text-xs text-stone-500">{selectedPartner.picPosition}</p>}<div className="mt-2 space-y-0.5 text-xs text-stone-500">{selectedPartner.picPhone && <p>{selectedPartner.picPhone}</p>}{selectedPartner.picEmail && <p>{selectedPartner.picEmail}</p>}</div></div><label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-stone-700"><input type="checkbox" checked={differentPic} onChange={e => setDifferentPic(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" /><span><strong>PIC kegiatan berbeda dengan PIC utama</strong><small className="mt-0.5 block text-xs text-stone-500">Isi data PIC khusus kegiatan ini.</small></span></label>{differentPic && <div className="mt-4 grid gap-3 border-t border-emerald-100 pt-4 sm:grid-cols-2"><Field label="Nama PIC *" value={overridePic.name} onChange={v => setP("name", v)} /><Field label="Jabatan" value={overridePic.position} onChange={v => setP("position", v)} /><Field label="Email" type="email" value={overridePic.email} onChange={v => setP("email", v)} /><Field label="Telepon" value={overridePic.phone} onChange={v => setP("phone", v)} /></div>}</div>}
        {selectedPartner && <div className="rounded-xl border border-stone-100 bg-stone-50 p-3"><p className="text-sm font-semibold text-stone-800">Logo Mitra</p>{selectedPartner.logoFileId ? <div className="mt-2"><div className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-[10px] font-bold text-emerald-700">✓</span><span className="text-sm text-emerald-700">Logo tersedia</span></div><p className="mt-1 text-xs text-stone-500">Logo mitra akan otomatis dipakai untuk dokumen IA.</p></div> : <div className="mt-2"><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"><FileUp className="h-4 w-4" /> Pilih Logo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProposalLogo(f); }} /></label>{proposalLogoFileId ? <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><FileText className="h-4 w-4" /> {proposalLogoName || "Logo terunggah"}<button type="button" onClick={() => { setProposalLogoFileId(null); setProposalLogoName(null); }} className="text-emerald-600 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></span> : <span className="text-xs text-stone-400">Belum ada logo</span>}{uploadingProposalLogo && <span className="text-xs text-emerald-700">Mengunggah...</span>}</div><p className="mt-2 text-xs text-stone-500">Jika mitra belum memiliki logo, Anda dapat menguploadnya di sini.</p></div>}</div>}
        {!selectedPartner && partnerQuery && filteredPartners.length === 0 && <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">Mitra tidak ditemukan. <Link href="/usulkan" className="ml-2 font-semibold text-emerald-700">Usulkan Mitra Baru →</Link></div>}
        <div className="flex justify-between"><button onClick={() => setStep(1)} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600">Kembali</button><button onClick={() => setStep(3)} disabled={!selectedPartner || (differentPic && !overridePic.name)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lanjut <ArrowRight className="h-4 w-4" /></button></div></section>}

      {step === 3 && <section className="space-y-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6"><div><label className="mb-1.5 block text-sm font-medium text-stone-700">Jenis kegiatan *</label><select value={activityType} onChange={e => setActivityType(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"><option value="MAGANG">Magang / MBKM</option><option value="PRAKTIKUM">Praktikum</option><option value="PENELITIAN">Penelitian</option><option value="TUGAS_AKHIR">Tugas Akhir</option><option value="PENGABDIAN">Pengabdian</option><option value="KUNJUNGAN">Kunjungan</option><option value="LAINNYA">Kegiatan Lainnya</option></select></div><Field label="Judul kegiatan *" value={activity.title} onChange={v => setA("title", v)} placeholder="Contoh: Magang MBKM pada bagian Quality Control" /><Field label="Deskripsi singkat" value={activity.description} onChange={v => setA("description", v)} multiline /><Field label="Tujuan kegiatan" value={activity.goal} onChange={v => setA("goal", v)} multiline /><div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal mulai *" type="date" value={activity.dateStart} onChange={v => setA("dateStart", v)} /><Field label="Tanggal selesai *" type="date" value={activity.dateEnd} onChange={v => setA("dateEnd", v)} /></div><Field label="Lokasi kegiatan" value={activity.location} onChange={v => setA("location", v)} /><Field label="Jumlah peserta" type="number" value={activity.participantCount} onChange={v => setA("participantCount", v)} />{activityType === "MAGANG" && <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Dokumen RKP (Rencana Kerja Pembelajaran)</p><p className="mb-2 text-xs text-stone-400">Unggah dokumen RKP dalam format PDF agar admin dapat memverifikasi kelengkapan data.</p><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"><FileUp className="h-4 w-4" /> Pilih File RKP<input type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadRkp(f); }} /></label>{rkpUrl ? <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><FileText className="h-4 w-4" /> {rkpName || "RKP terunggah"}<button type="button" onClick={() => { setRkpUrl(""); setRkpName(""); }} className="text-emerald-600 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></span> : <span className="text-xs text-stone-400">Belum ada file dipilih</span>}{uploadingRkp && <span className="text-xs text-emerald-700">Mengunggah...</span>}</div></div>}
        {activityType === "MAGANG" && <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Surat Penerimaan Magang dari Mitra <span className="font-normal text-stone-400">(opsional)</span></p><p className="mb-2 text-xs text-stone-400">Unggah surat penerimaan magang dalam format PDF.</p><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"><FileUp className="h-4 w-4" /> Pilih Surat Penerimaan<input type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void uploadSpm(f); }} /></label>{spmUrl ? <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><FileText className="h-4 w-4" /> {spmName || "Surat terunggah"}<button type="button" onClick={() => { setSpmUrl(""); setSpmName(""); }} className="text-emerald-600 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></span> : <span className="text-xs text-stone-400">Belum ada file dipilih</span>}{uploadingSpm && <span className="text-xs text-emerald-700">Mengunggah...</span>}</div></div>}
        <div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Dosen pendamping</p><div className="space-y-2">{dosens.map((d, i) => <div key={i} className="flex gap-2"><input value={d} onChange={e => setDosens(p => p.map((x, j) => j === i ? e.target.value : x))} placeholder="Nama dosen / DPL" className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm" />{dosens.length > 1 && <button onClick={() => setDosens(p => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-stone-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>)}<button onClick={() => setDosens(p => [...p, ""])} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"><Plus className="h-3.5 w-3.5" /> Tambah Dosen</button></div></div><div className="border-t border-stone-100 pt-4"><p className="mb-3 text-sm font-medium text-stone-700">Peserta mahasiswa</p><div className="space-y-2">{students.map((s, i) => <div key={i} className="flex gap-2"><input value={s} onChange={e => setStudents(p => p.map((x, j) => j === i ? e.target.value : x))} placeholder="Nama mahasiswa" className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm" />{students.length > 1 && <button onClick={() => setStudents(p => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-stone-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>)}<button onClick={() => setStudents(p => [...p, ""])} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"><Plus className="h-3.5 w-3.5" /> Tambah Mahasiswa</button></div></div><div className="flex justify-between"><button onClick={() => setStep(2)} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600">Kembali</button><button onClick={() => setStep(4)} disabled={!activity.title || !activity.dateStart || !activity.dateEnd || (activityType === "MAGANG" && !rkpUrl)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Lihat Ringkasan <ArrowRight className="h-4 w-4" /></button></div></section>}

      {step === 4 && <section className="space-y-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6"><SummaryBlock title="Data Diri" items={[["Nama", identity.name], ["NIM", identity.nim], ["Program Studi", identity.prodi]]} /><SummaryBlock title="Mitra & PIC" items={[["Mitra", selectedPartner?.name || "-"], ["PIC", differentPic ? overridePic.name : selectedPartner?.picName || "Belum ada PIC"]]} /><SummaryBlock title="Kegiatan" items={[["Jenis", activityType], ["Judul", activity.title], ["Periode", `${activity.dateStart} — ${activity.dateEnd}`], ["Lokasi", activity.location || "-"], ["Peserta", students.filter(Boolean).length.toString()], ["Dosen", dosens.filter(Boolean).length ? dosens.filter(Boolean).join(", ") : "-"], ["Dokumen RKP", rkpUrl ? rkpName || "Terunggah" : "Belum diunggah"], ["Surat Penerimaan", spmUrl ? spmName || "Terunggah" : "Belum diunggah"]]} />{state === "error" && <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{message}</div>}<div className="flex justify-between"><button onClick={() => setStep(3)} className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600">Kembali</button><button disabled={state === "loading"} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" />{state === "loading" ? "Mengirim..." : revisionId ? "Kirim Perbaikan" : "Kirim Pengajuan"}</button></div></section>}
    </div></div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, multiline = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm" /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm" />}</label>;
}
function SummaryBlock({ title, items }: { title: string; items: [string, string][] }) {
  return <div className="rounded-xl border border-stone-100 bg-stone-50 p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">{title}</h3><div className="space-y-2">{items.map(([k, v]) => <div key={k} className="flex justify-between gap-4 text-sm"><span className="text-stone-500">{k}</span><span className="text-right font-semibold text-stone-800">{v}</span></div>)}</div></div>;
}
