export type SubmissionStatus =
  | "DRAFT"
  | "DIAJUKAN"
  | "MENUNGGU_VALIDASI"
  | "PERLU_PERBAIKAN"
  | "IA_DIPROSES"
  | "IA_DISETUJUI"
  | "SIAP_BERANGKAT"
  | "BERLANGSUNG"
  | "MENUNGGU_LAPORAN"
  | "LAPORAN_DIAJUKAN"
  | "LAPORAN_DIREVISI"
  | "SELESAI";

export interface SubmissionParticipant {
  name: string;
  nim?: string;
  role?: "MAHASISWA" | "DOSEN" | "PIC_MITRA";
}

export interface Submission {
  id: string;
  submissionCode?: string;
  partnerId: string;
  partnerName: string;
  partnerLogoUrl?: string;
  activityType: string;
  title: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  location?: string;
  participantCount?: number;
  participants: SubmissionParticipant[];
  rkpStatus?: "BELUM_ADA" | "DIAJUKAN" | "PERLU_PERBAIKAN" | "DISETUJUI";
  rkpUrl?: string;
  iaNumber?: string;
  iaStatus?: "DRAFT" | "DISETUJUI" | "DITANDATANGANI";
  status: SubmissionStatus;
  submitterName?: string;
  submitterEmail?: string;
  submitterNim?: string;
  partnerPIC?: string;
  partnerPICPosition?: string;
  partnerPICPhone?: string;
  partnerPICEmail?: string;
  dosenName?: string;
  reportDate?: string;
  reportSummary?: string;
  reportOutput?: string;
  reportLink?: string;
  createdAt: string;
  updatedAt: string;
}
