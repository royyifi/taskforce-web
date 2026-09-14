"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Agreement = { id: string; number: string | null; createdAt: string; startDate: string | null; endDate: string | null; notes: string | null };
type Form = { number: string; inputDate: string; startDate: string; endDate: string; notes: string };
const EMPTY: Form = { number: "", inputDate: "", startDate: "", endDate: "", notes: "" };

function dateValue(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function displayDate(value: string | null) { return value ? new Date(value).toLocaleDateString("id-ID") : "-"; }

export default function AgreementAdmin({ partnerId, initialAgreements }: { partnerId: string; initialAgreements: Agreement[] }) {
  const [agreements, setAgreements] = useState(initialAgreements);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Form, value: string) => setForm(current => ({ ...current, [key]: value }));

  function startEdit(agreement: Agreement) {
    setEditing(agreement.id);
    setForm({ number: agreement.number || "", inputDate: dateValue(agreement.createdAt), startDate: dateValue(agreement.startDate), endDate: dateValue(agreement.endDate), notes: agreement.notes || "" });
    setMessage("");
  }
  function reset() { setEditing(null); setForm(EMPTY); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const response = await fetch(editing ? `/api/admin/agreements/${editing}` : "/api/admin/agreements", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partnerId, ...form }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Data perjanjian gagal disimpan."); setSaving(false); return; }
    setAgreements(current => editing ? current.map(item => item.id === editing ? data.agreement : item) : [data.agreement, ...current]);
    setMessage(editing ? "Perjanjian diperbarui." : "Perjanjian ditambahkan.");
    reset(); setSaving(false);
  }

  async function remove(agreement: Agreement) {
    if (!window.confirm(`Hapus perjanjian ${agreement.number || "ini"}?`)) return;
    const response = await fetch(`/api/admin/agreements/${agreement.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Perjanjian gagal dihapus."); return; }
    setAgreements(current => current.filter(item => item.id !== agreement.id));
  }

  return <div className="space-y-4">
    {agreements.length ? <div className="space-y-3">{agreements.map(agreement => <div key={agreement.id} className="rounded-xl border border-stone-100 bg-stone-50/60 p-4"><div className="grid gap-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-stone-400">Nomor PKS</p><p className="mt-1 font-semibold text-stone-900">{agreement.number || "-"}</p></div><div><p className="text-xs text-stone-400">Tanggal input</p><p className="mt-1 text-stone-700">{displayDate(agreement.createdAt)}</p></div><div><p className="text-xs text-stone-400">Mulai</p><p className="mt-1 text-stone-700">{displayDate(agreement.startDate)}</p></div><div><p className="text-xs text-stone-400">Berakhir</p><p className="mt-1 text-stone-700">{displayDate(agreement.endDate)}</p></div></div><div className="mt-3 flex gap-1"><button type="button" onClick={() => startEdit(agreement)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-white hover:text-emerald-700"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => void remove(agreement)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-white hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Hapus</button></div></div>)}</div> : <p className="py-6 text-center text-sm text-stone-400">Belum ada data perjanjian</p>}
    {editing === null && <button type="button" onClick={() => { setMessage(""); setEditing(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Tambah Perjanjian</button>}
    {editing !== null && <form onSubmit={save} className="grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-medium text-stone-700">Nomor PKS</span><input value={form.number} onChange={event => set("number", event.target.value)} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" placeholder="-" /></label><label><span className="mb-1.5 block text-xs font-medium text-stone-700">Tanggal input</span><input type="date" value={form.inputDate} onChange={event => set("inputDate", event.target.value)} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label><label><span className="mb-1.5 block text-xs font-medium text-stone-700">Masa berlaku mulai</span><input type="date" value={form.startDate} onChange={event => set("startDate", event.target.value)} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label><label><span className="mb-1.5 block text-xs font-medium text-stone-700">Masa berlaku berakhir</span><input type="date" value={form.endDate} onChange={event => set("endDate", event.target.value)} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan..." : "Simpan"}</button><button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"><X className="h-3.5 w-3.5" /> Batal</button></div></form>}
    {message && <p className="text-xs text-emerald-700">{message}</p>}
  </div>;
}
