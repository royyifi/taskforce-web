import Link from "next/link";
import { ArrowRight, Calendar, Building2, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ActivityLite {
  id: string;
  activityCode: string | null;
  title: string;
  type: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  partnerName: string;
  partnerSlug: string;
  location: string | null;
  photoUrl: string | null;
  submittedBy: string | null;
  submitterUnit: string | null;
}

export default function ActivityCard({ activity }: { activity: ActivityLite }) {
  return (
    <Link
      href={`/magang/kegiatan/${activity.id}`}
      className="group block overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
    >
      <div className={`flex h-40 w-full items-center justify-center overflow-hidden ${activity.photoUrl ? "bg-stone-100" : "bg-white"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activity.photoUrl || "/logo-unej.png"}
          alt={`Foto kegiatan ${activity.title}`}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${activity.photoUrl ? "object-cover" : "object-contain p-3"}`}
        />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {activity.activityCode && <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">{activity.activityCode}</p>}
            <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
              {activity.title}
            </h3>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-600" />
        </div>

        {/* Pengaju & Prodi */}
        {activity.submittedBy && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-stone-600">
            <User className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-medium">{activity.submittedBy}</span>
            {activity.submitterUnit && <span className="text-stone-400">· {activity.submitterUnit}</span>}
          </div>
        )}

        {/* Mitra & Periode */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {activity.partnerName}
          </span>
          {activity.dateStart && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(activity.dateStart)}
              {activity.dateEnd && ` — ${formatDate(activity.dateEnd)}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {activity.type}
          </span>
          {activity.location && (
            <span className="text-[11px] text-stone-400">{activity.location}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
