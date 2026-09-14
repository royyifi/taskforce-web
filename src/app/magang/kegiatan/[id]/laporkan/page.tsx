import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReportForm from "./report-form";

export const dynamic = "force-dynamic";

function getStage(a: { status: string; reportDate: Date | null; dateStart: Date | null; dateEnd: Date | null; iaNumber: string | null; iaStatus: string | null; source: string | null; iaConfirmedAt: Date | null; completedAt: Date | null }) {
  if (a.status === "REJECTED") return -1;
  if (a.completedAt) return 6;
  const now = new Date();

  // IA_DIRECT: langsung berlangsung kalau sudah ada iaNumber/iaConfirmedAt
  if (a.source === "IA_DIRECT") {
    if (a.iaConfirmedAt || a.iaNumber) return 5;
    if (a.iaStatus === "DIAJUKAN" || a.iaStatus === "REVISI") return 2;
    return 0;
  }

  // Student activities
  if (a.iaConfirmedAt) {
    if (a.dateStart && a.dateStart <= now) return 5;
    return 4;
  }
  if (a.iaNumber || a.iaStatus === "DISETUJUI" || a.iaStatus === "DITANDATANGANI") return 3;
  if (a.reportDate) return 5;
  if (a.dateStart && a.dateStart <= now) return 5;
  if (a.status === "APPROVED") return 2;
  return 0;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await db.activity.findUnique({
    where: { id },
    select: { id: true, title: true, activityCode: true, status: true, reportDate: true, dateStart: true, dateEnd: true, iaNumber: true, iaStatus: true, source: true, iaConfirmedAt: true, completedAt: true, partner: { select: { name: true } } },
  });
  if (!activity) notFound();
  const stage = getStage(activity);
  if (stage !== 5) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-stone-500">Halaman laporan hanya tersedia untuk kegiatan yang sedang berlangsung.</p><Link href={`/magang/kegiatan/${activity.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">← Kembali ke Status</Link></div>;

  return <ReportForm activityId={activity.id} activityTitle={activity.title} activityCode={activity.activityCode} partnerName={activity.partner.name} />;
}
