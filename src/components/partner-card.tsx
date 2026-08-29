import Link from "next/link";
import { cn, FIELD_LABELS, LEVEL_COLORS } from "@/lib/utils";
import { MapPin, Building2, ArrowRight } from "lucide-react";

export interface PartnerLite {
  id: string;
  slug: string;
  name: string;
  level: string;
  category: string | null;
  city: string | null;
  country: string | null;
  utilizationLabel: string;
  utilizationColor: string;
  fieldNames: string[];
}

export default function PartnerCard({ partner }: { partner: PartnerLite }) {
  const location = partner.level === "INTERNASIONAL"
    ? partner.country || "Internasional"
    : partner.city || partner.level;
  const levelColor = LEVEL_COLORS[partner.level] || LEVEL_COLORS.LOKAL;

  return (
    <Link
      href={`/mitra/${partner.slug}`}
      className="group block rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700 transition-colors">
          {partner.name}
        </h3>
        <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-emerald-600" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("rounded-full border px-2.5 py-0.5 font-medium", levelColor)}>
          {partner.level}
        </span>
        {partner.category && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-600">
            {partner.category}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
        {partner.fieldNames.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {partner.fieldNames.length} bidang
          </span>
        )}
      </div>

      {partner.fieldNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {partner.fieldNames.slice(0, 4).map((f) => (
            <span key={f} className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {f}
            </span>
          ))}
          {partner.fieldNames.length > 4 && (
            <span className="rounded bg-stone-50 px-2 py-0.5 text-[11px] text-stone-500">
              +{partner.fieldNames.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
