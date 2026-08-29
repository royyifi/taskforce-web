import Link from "next/link";
import { ArrowRight, Calendar, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ActivityLite {
  id: string;
  title: string;
  type: string;
  dateStart: Date | null;
  partnerName: string;
  partnerSlug: string;
  location: string | null;
  photoUrl: string | null;
}

export default function ActivityCard({ activity }: { activity: ActivityLite }) {
  return (
    <Link
      href={`/kegiatan`}
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
          <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700 transition-colors">
            {activity.title}
          </h3>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-600" />
        </div>

        <div className="mb-2 flex items-center gap-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {activity.partnerName}
          </span>
          {activity.dateStart && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(activity.dateStart)}
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
