"use client";

import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Save, Trash2, UserCog, X } from "lucide-react";

interface User { id: string; name: string; email: string; role: string; unit: string | null; status: string; createdAt: string }
type Form = { name: string; email: string; unit: string; password: string };
const EMPTY: Form = { name: "", email: "", unit: "", password: "" };

export default function AccountAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() { const r = await fetch("/api/admin/users"); if (r.ok) setUsers((await r.json()).users); setLoading(false); }
  useEffect(() => { load(); }, []);
  const set = (k: keyof Form, v: string) => setForm(p => ({ ...p, [k]: v }));
  function startEdit(u: User) { setEditing(u.id); setForm({ name: u.name, email: u.email, unit: u.unit || "", password: "" }); setMessage(""); setError(""); }
  function reset() { setEditing(null); setForm(EMPTY); setError(""); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    const r = await fetch(editing ? `/api/admin/users/${editing}` : "/api/admin/users", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { name: form.name, email: form.email, unit: form.unit, ...(form.password ? { password: form.password } : {}) } : form),
    });
    const result = await r.json();
    if (!r.ok) setError(result.error || "Gagal menyimpan.");
    else { setMessage(editing ? "Akun diperbarui." : "Akun admin tim dibuat."); reset(); await load(); }
    setSaving(false);
  }

  async function toggleStatus(u: User) {
    const r = await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) });
    if (r.ok) load(); else setError((await r.json()).error);
  }

  async function remove(u: User) {
    if (!confirm(`Hapus akun ${u.email}? Tindakan ini tidak bisa dibatalkan.`)) return;
    const r = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (r.ok) load(); else setError((await r.json()).error);
  }

  return <section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-stone-900"><UserCog className="h-5 w-5 text-emerald-600" /> Kelola Akun Admin Tim</h2><p className="mt-1 text-sm text-stone-500">Buat dan kelola akun untuk anggota tim. Admin tim dapat memverifikasi pengajuan tetapi tidak dapat mengelola akun.</p></div></div>

    <form onSubmit={save} className="mt-5 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-emerald-700">{editing ? "Edit akun" : "Tambah akun baru"}</div>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Nama lengkap *</span><input required value={form.name} onChange={e => set("name", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Email *</span><input required type="email" value={form.email} onChange={e => set("email", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Unit / Program Studi</span><input value={form.unit} onChange={e => set("unit", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{editing ? "Password baru (kosongkan jika tidak diubah)" : "Password * (minimal 6 karakter)"}</span><input type="password" required={!editing} value={form.password} onChange={e => set("password", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      {message && <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p>}
      <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Akun"}</button>{editing && <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600"><X className="h-3.5 w-3.5" /> Batal</button>}</div>
    </form>

    {loading ? <p className="mt-5 text-sm text-stone-400">Memuat...</p> : <div className="mt-5 divide-y divide-stone-100">
      {users.map(u => <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-semibold text-stone-800">{u.name}
            {u.role === "SUPER_ADMIN" ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Super Admin</span> : <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Admin Tim</span>}
            {u.status === "INACTIVE" && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-500">Nonaktif</span>}
          </p>
          <p className="truncate text-xs text-stone-400">{u.email}{u.unit ? ` · ${u.unit}` : ""}</p>
        </div>
        {u.role === "TEAM_ADMIN" && <div className="flex shrink-0 gap-1.5">
          <button onClick={() => toggleStatus(u)} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${u.status === "ACTIVE" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>{u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</button>
          <button onClick={() => startEdit(u)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-emerald-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => remove(u)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
        </div>}
      </div>)}
    </div>}
  </section>;
}
