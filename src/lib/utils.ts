import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Parse Indonesian date string (dd/mm/yyyy–dd/mm/yyyy) to {start, end}
 */
export function parsePeriod(period: string | null): {
  start: Date | null;
  end: Date | null;
} {
  if (!period) return { start: null, end: null };

  // Try to find two dates: dd/mm/yyyy
  const matches = period.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g
  );
  if (!matches || matches.length < 1) return { start: null, end: null };

  const parseOne = (s: string): Date => {
    const [d, m, y] = s.split(/[\/\-]/);
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const start = parseOne(matches[0]);
  const end = matches.length >= 2 ? parseOne(matches[1]) : null;
  return { start, end };
}

/**
 * Calculate partner utilization status based on activities
 * 🟢 Sudah ada Implementasi: activity approved within last 6 months
 * 🟡 Belum ada Implementasi: has partner record but no activity
 * 🔵 Potensial: mapped but no agreement or activity
 * 🔴 Tidak Aktif / Berakhir: agreement expired
 */
export function getUtilizationStatus(
  lastActivityDate: Date | null,
  hasAgreement: boolean,
  agreementActive: boolean
): { status: string; label: string; color: string } {
  if (!hasAgreement && !lastActivityDate) {
    return { status: "POTENTIAL", label: "Potensial", color: "blue" };
  }
  if (hasAgreement && !agreementActive && !lastActivityDate) {
    return { status: "INACTIVE", label: "Tidak Aktif", color: "red" };
  }
  if (lastActivityDate) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (lastActivityDate >= sixMonthsAgo) {
      return { status: "USED", label: "Sudah ada Implementasi", color: "green" };
    }
  }
  if (hasAgreement) {
    return { status: "UNUSED", label: "Belum ada Implementasi", color: "yellow" };
  }
  return { status: "POTENTIAL", label: "Potensial", color: "blue" };
}

/**
 * Get agreement status based on end date
 */
export function getAgreementStatus(
  endDate: Date | null
): { status: string; label: string; color: string; daysLeft: number | null } {
  if (!endDate) return { status: "UNKNOWN", label: "Tidak Diketahui", color: "gray", daysLeft: null };
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { status: "EXPIRED", label: "Berakhir", color: "red", daysLeft };
  if (daysLeft <= 90) return { status: "ENDING_SOON", label: "Akan Berakhir", color: "orange", daysLeft };
  if (daysLeft <= 180) return { status: "WARNING", label: "Mendekati Berakhir", color: "yellow", daysLeft };
  return { status: "ACTIVE", label: "Aktif", color: "green", daysLeft };
}

/**
 * Format date to Indonesian style
 */
export function formatDate(date: Date | null): string {
  if (!date) return "-";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format short date
 */
export function formatDateShort(date: Date | null): string {
  if (!date) return "-";
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * Cooperation field codes to display names
 */
export const FIELD_LABELS: Record<string, string> = {
  MG: "Magang",
  AM: "Agribisnis Muda",
  RS: "Riset",
  PI: "Penelitian",
  PK: "Pengabdian",
  KW: "Kuliah Kerja",
  KKN: "KKN",
};

/**
 * Partner category labels
 */
export const CATEGORY_LABELS: Record<string, string> = {
  PERGURUAN_TINGGI: "Perguruan Tinggi",
  INDUSTRI: "Industri",
  PEMERINTAH: "Pemerintah",
  BUMN: "BUMN",
  BUMD: "BUMD",
  SEKOLAH: "Sekolah",
  NGO: "NGO",
  UMKM: "UMKM",
  SWASTA: "Swasta",
  KOMUNITAS: "Komunitas",
  LAINNYA: "Lainnya",
};

/**
 * Level color map
 */
export const LEVEL_COLORS: Record<string, string> = {
  LOKAL: "text-emerald-700 bg-emerald-50 border-emerald-200",
  NASIONAL: "text-blue-700 bg-blue-50 border-blue-200",
  INTERNASIONAL: "text-purple-700 bg-purple-50 border-purple-200",
};
