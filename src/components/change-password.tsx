"use client";

import { useState } from "react";
import { KeyRound, Save } from "lucide-react";

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setState("error"); setMessage("Konfirmasi password tidak sama."); return; }
    if (form.newPassword.length < 6) { setState("error"); setMessage("Password baru minimal 6 karakter."); return; }
    setState("saving");
    const r = await fetch("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
    const result = await r.json();
    if (r.ok) { setState("ok"); setMessage(result.message); setForm({ currentPassword: "", newPassword: "", confirm: "" }); }
    else { setState("error"); setMessage(result.error); }
  }

  return <section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900"><KeyRound className="h-5 w-5 text-emerald-600" /> Ubah Password</h2>
    <p className="mt-1 text-sm text-stone-500">Ganti password akun Anda sendiri.</p>
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-3">
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Password lama *</span><input required type="password" value={form.currentPassword} onChange={e => set("currentPassword", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Password baru *</span><input required type="password" value={form.newPassword} onChange={e => set("newPassword", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Konfirmasi password baru *</span><input required type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label>
      {message && <p className={`text-sm sm:col-span-3 ${state === "ok" ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
      <div className="sm:col-span-3"><button disabled={state === "saving"} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {state === "saving" ? "Menyimpan..." : "Simpan Password Baru"}</button></div>
    </form>
  </section>;
}
