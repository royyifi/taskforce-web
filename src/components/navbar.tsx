"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Menu, X, Handshake, LockKeyhole, LogOut } from "lucide-react";

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/mitra", label: "Mitra" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/tentang", label: "Tentang" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setLoggedIn(!!d.user)).catch(() => {});
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Handshake className="h-5 w-5" />
          </span>
          <div className="hidden leading-tight sm:block">
            <span className="block text-sm font-bold tracking-tight text-stone-900">
              Taskforce Kerja Sama
            </span>
            <span className="block text-[10px] font-medium text-emerald-700">
              Teknologi Hasil Pertanian
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Admin (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/usulkan"
            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            + Usulkan Mitra
          </Link>
          <Link
            href="/laporkan"
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            + Laporkan Kegiatan
          </Link>
          <Link
            href={loggedIn ? "/admin" : "/login"}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:text-emerald-700"
          >
            <LockKeyhole className="h-3.5 w-3.5" /> {loggedIn ? "Dashboard" : "Admin"}
          </Link>
          {loggedIn && <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"><LogOut className="h-3.5 w-3.5" /> Keluar</button>}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 pt-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            <Link
              href="/usulkan"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-center text-xs font-semibold text-stone-700"
            >
              + Usulkan Mitra
            </Link>
            <Link
              href="/laporkan"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2.5 text-center text-xs font-semibold text-white"
            >
              + Laporkan Kegiatan
            </Link>
            <Link
              href={loggedIn ? "/admin" : "/login"}
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-center text-xs font-semibold text-stone-600"
            >
              {loggedIn ? "Dashboard" : "Admin"}
            </Link>
          </div>
          {loggedIn && <button onClick={logout} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600"><LogOut className="h-3.5 w-3.5" /> Keluar</button>}
        </div>
      )}
    </header>
  );
}
