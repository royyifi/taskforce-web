"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@taskforce.unej.ac.id");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Jika sesi masih aktif, langsung ke dashboard — tidak perlu login ulang
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => { if (d.user) window.location.replace("/admin"); }).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Login gagal."); setLoading(false); return; }
    router.push("/admin"); router.refresh();
  }

  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-50 px-4 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Kembali ke beranda</Link><div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm sm:p-8"><div className="mb-7 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-6 w-6" /></span><h1 className="mt-4 text-2xl font-bold text-stone-900">Login Admin</h1><p className="mt-1 text-sm text-stone-500">Kelola data dan verifikasi pengajuan.</p></div>{error && <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">Password</span><div className="relative"><input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password admin" className="h-11 w-full rounded-lg border border-stone-200 px-3 pr-11 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 transition-colors hover:text-emerald-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label><button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"><LogIn className="h-4 w-4" />{loading ? "Memproses..." : "Masuk sebagai Admin"}</button></form><p className="mt-5 text-center text-xs text-stone-400">Akses ini khusus untuk pengelola Taskforce Kerja Sama.</p></div></div></div>;
}
