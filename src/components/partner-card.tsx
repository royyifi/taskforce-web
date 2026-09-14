import Link from "next/link";
import { cn, LEVEL_COLORS } from "@/lib/utils";
import { MapPin, Globe2, Phone, Mail, CalendarDays } from "lucide-react";

export interface PartnerLite {
  id: string;
  slug: string;
  name: string;
  level: string;
  category: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  utilizationLabel: string;
  utilizationColor: string;
  fieldNames: string[];
  agreements: { number: string | null; startDate: string | null; endDate: string | null }[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function PartnerCard({ partner }: { partner: PartnerLite }) {
  const levelColor = LEVEL_COLORS[partner.level] || LEVEL_COLORS.LOKAL;
  const location = [partner.city, partner.country].filter(Boolean).join(", ");

  // Cari perjanjian aktif yang paling baru
  const activeAgreement = partner.agreements.find(a => {
    if (!a.endDate) return false;
    return new Date(a.endDate) > new Date();
  });
  const displayAgreement = activeAgreement || partner.agreements[0] || null;

  return (
    <Link
      href={`/mitra/${partner.slug}`}
      className="group block rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
    >
      {/* Nama */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700 transition-colors">
          {partner.name}
        </h3>
      </div>

      {/* Level + Kategori badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("rounded-full border px-2.5 py-0.5 font-medium", levelColor)}>
          {partner.level}
        </span>
        {partner.category && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
            {partner.category}
          </span>
        )}
      </div>

      {/* Alamat */}
      {location && (
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{location}</span>
        </div>
      )}

      {/* Kontak: Website, Phone, Email */}
      {partner.website && (
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-stone-500">
          <Globe2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{partner.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
        </div>
      )}
      {partner.phone && (
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-stone-500">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{partner.phone}</span>
        </div>
      )}
      {partner.email && (
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-stone-500">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{partner.email}</span>
        </div>
      )}

      {/* Masa Berlaku Perjanjian */}
      {displayAgreement && (
        <div className="mb-3 mt-2 flex items-center gap-1.5 text-xs text-stone-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>
            {fmtDate(displayAgreement.startDate)} — {fmtDate(displayAgreement.endDate)}
          </span>
        </div>
      )}

      {/* Bidang Kerja Sama */}
      {partner.fieldNames.length > 0 && (
        <div className={displayAgreement ? "" : "mt-2"}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Bidang Kerja Sama</p>
          <div className="flex flex-wrap gap-1.5">
            {partner.fieldNames.map((f) => (
              <span key={f} className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
