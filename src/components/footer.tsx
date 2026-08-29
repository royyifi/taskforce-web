import { Handshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Handshake className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-stone-900">
                Taskforce Kerja Sama
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-500">
              Portal pemetaan dan dokumentasi kerja sama Teknologi Hasil Pertanian.
              Membangun Kemitraan, Menguatkan Kolaborasi, Menciptakan Dampak.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div>
              <p className="mb-2.5 font-semibold text-stone-900">Menu</p>
              <ul className="space-y-1.5 text-stone-500">
                <li><a href="/" className="hover:text-emerald-700">Beranda</a></li>
                <li><a href="/mitra" className="hover:text-emerald-700">Mitra</a></li>
                <li><a href="/kegiatan" className="hover:text-emerald-700">Kegiatan</a></li>
                <li><a href="/tentang" className="hover:text-emerald-700">Tentang</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-2.5 font-semibold text-stone-900">Kontak</p>
              <ul className="space-y-1.5 text-stone-500">
                <li>Tim Kerja Sama</li>
                <li>Fakultas Teknologi Pertanian</li>
                <li>Universitas Jember</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-100 pt-6 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Taskforce Kerja Sama THP — Universitas Jember. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
