"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Send, PencilLine } from "lucide-react";

interface PartnerData {
  id: string; name: string; level: string; category: string | null;
  address: string | null; phone: string | null; email: string | null; website: string | null;
  picName: string | null; picPosition: string | null; picPhone: string | null; picEmail: string | null;
  city: string | null; country: string | null;
}

export default function EditMitraPage({ params }: { params: Promise<{ slug: string }> }) {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then(({ slug }) => fetch(`/api/partners?slug=${slug}`).then(r => r.json()).then(d => {
      const p = d.partner;
      if (!p) return;
      const values = { name: p.name || "", level: p.level || "NASIONAL", category: p.category || "", address: p.address || "", phone: p.phone || "", email: p.email || "", website: p.website || "", picName: p.picName || "", picPosition: p.picPosition || "", picPhone: p.picPhone || "", picEmail: p.picEmail || "", city: p.city || "", country: p.country || "" };
      setPartner(p);
      setInitialValues(values);
      setForm({ ...values, submitterName: "", submitterEmail: "", submitterUnit: "", note: "" });
    }));
  }, [params]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("loading");
    const { submitterName, submitterEmail, submitterUnit, note, ...data } = form;
    const changes = Object.fromEntries(Object.entries(data).filter(([key, value]) => value.trim() !== (initialValues[key] || "").trim()));
    const res = await fetch("/api/partner-edits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partnerId: partner?.id, submitterName, submitterEmail: submitterEmail || undefined, submitterUnit, note, ...changes }) });
    const result = await res.json();
    setMessage(result.message || result.error);
    setState(res.ok ? "success" : "error");
  }

  if (state === "success") return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 text-2xl font-bold text-stone-900">Usulan perbaikan terkirim</h1><p className="mt-2 text-stone-500">{message}</p><Link href="/mitra" className="mt-7 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Kembali ke Mitra</Link></div>
  );

  if (!partner) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>;

  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Koreksi data publik</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">Perbaiki Data Mitra</h1>
          <p className="mt-2 text-stone-500">Melaporkan data yang keliru atau memperbarui informasi <span className="font-semibold text-stone-700">{partner.name}</span>. Usulan Anda akan diverifikasi admin sebelum diterapkan.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Section title="Data Mitra">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama mitra" value={form.name} onChange={v => set("name", v)} className="sm:col-span-2" />
              <Select label="Level" value={form.level} onChange={v => set("level", v)} options={[["LOKAL", "Lokal"], ["NASIONAL", "Nasional"], ["INTERNASIONAL", "Internasional"]]} />
              <Select label="Kategori" value={form.category} onChange={v => set("category", v)} options={[["PERGURUAN_TINGGI", "Perguruan Tinggi"], ["INDUSTRI", "Industri"], ["PEMERINTAH", "Pemerintah"], ["BUMN", "BUMN"], ["BUMD", "BUMD"], ["SEKOLAH", "Sekolah"], ["UMKM", "UMKM"], ["LAINNYA", "Lainnya"]]} />
              <TextArea label="Alamat" value={form.address} onChange={v => set("address", v)} />
              <Input label="Kota" value={form.city} onChange={v => set("city", v)} />
              <Input label="Negara" value={form.country} onChange={v => set("country", v)} />
              <Input label="Telepon" value={form.phone} onChange={v => set("phone", v)} />
              <Input label="Email" type="email" value={form.email} onChange={v => set("email", v)} />
              <Input label="Website" value={form.website} onChange={v => set("website", v)} />
            </div>
          </Section>

          <Section title="PIC Mitra">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama PIC" value={form.picName} onChange={v => set("picName", v)} />
              <Input label="Jabatan PIC" value={form.picPosition} onChange={v => set("picPosition", v)} />
              <Input label="Telepon PIC" value={form.picPhone} onChange={v => set("picPhone", v)} />
              <Input label="Email PIC" value={form.picEmail} onChange={v => set("picEmail", v)} />
            </div>
          </Section>

          <Section title="Data Pelapor">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama pelapor *" required value={form.submitterName} onChange={v => set("submitterName", v)} />
              <Input label="Email" type="email" value={form.submitterEmail} onChange={v => set("submitterEmail", v)} />
              <Input label="Unit / Program Studi" value={form.submitterUnit} onChange={v => set("submitterUnit", v)} className="sm:col-span-2" />
              <TextArea label="Catatan (apa yang keliru dan bagaimana seharusnya?)" value={form.note} onChange={v => set("note", v)} />
            </div>
          </Section>

          {state === "error" && <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{message}</div>}

          <button disabled={state === "loading"} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"><Send className="h-4 w-4" />{state === "loading" ? "Mengirim..." : "Kirim Usulan Perbaikan"}</button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-5 flex items-center gap-2 font-bold text-stone-900"><PencilLine className="h-4 w-4 text-emerald-600" />{title}</h2>{children}</section> }
function Input({ label, value, onChange, type = "text", required = false, className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; className?: string }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span><input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span><textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></label> }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-emerald-400">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label> }
