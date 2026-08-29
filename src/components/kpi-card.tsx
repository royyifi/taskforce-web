import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color?: string;
  className?: string;
}

export default function KpiCard({ label, value, suffix = "", icon: Icon, color = "emerald", className }: KpiCardProps) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue:    "bg-blue-50 text-blue-700",
    yellow:  "bg-amber-50 text-amber-700",
    red:     "bg-red-50 text-red-700",
    purple:  "bg-purple-50 text-purple-700",
    stone:   "bg-stone-100 text-stone-700",
  };
  return (
    <div className={cn(
      "flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
      className
    )}>
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colors[color] || colors.emerald)}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold tracking-tight text-stone-900">
          {value.toLocaleString("id-ID")}{suffix}
        </p>
        <p className="text-sm text-stone-500">{label}</p>
      </div>
    </div>
  );
}
