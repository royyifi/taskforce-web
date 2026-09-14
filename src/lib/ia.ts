import { db } from "@/lib/db";
import { getStoredFile } from "@/lib/storage";

export type IaFirstPartyKey = "PRODI" | "FAKULTAS";

/** Data resmi pihak pertama. Lengkapi nilai ini dengan data yang diberikan fakultas. */
export const IA_FIRST_PARTIES: Record<IaFirstPartyKey, {
  label: string;
  organizer: string;
  programStudy: string;
  faculty: string;
  university: string;
  signerName: string;
  signerPosition: string;
  address: string;
  titleLines: string[];
  signatureInstitutionLines: string[];
}> = {
  PRODI: {
    label: "Program Studi THP",
    organizer: "Program Studi Teknologi Hasil Pertanian",
    programStudy: "Program Studi Teknologi Hasil Pertanian",
    faculty: "Fakultas Teknologi Pertanian Universitas Jember",
    university: "Universitas Jember",
    signerName: "Lailatul Azkiyah, S.TP., M.P., Ph.D.",
    signerPosition: "Koordinator Program Studi Teknologi Hasil Pertanian",
    address: "Jalan Kalimantan No. 37, Kampus Tegalboto, Jember, Jawa Timur 68121",
    titleLines: ["Program Studi Teknologi Hasil Pertanian", "Fakultas Teknologi Pertanian Universitas Jember"],
    signatureInstitutionLines: ["Teknologi Hasil Pertanian", "Fakultas Teknologi Pertanian", "Universitas Jember"],
  },
  FAKULTAS: {
    label: "Fakultas Teknologi Pertanian",
    organizer: "Fakultas Teknologi Pertanian",
    programStudy: "Program Studi Teknologi Hasil Pertanian",
    faculty: "Fakultas Teknologi Pertanian Universitas Jember",
    university: "Universitas Jember",
    signerName: "Dr. Sri Wahyuningsih, S.P., M.T., IPM., ASEAN Eng.",
    signerPosition: "Dekan Fakultas Teknologi Pertanian",
    address: "Jalan Kalimantan No. 37, Kampus Tegalboto, Jember, Jawa Timur 68121",
    titleLines: ["Fakultas Teknologi Pertanian Universitas Jember"],
    signatureInstitutionLines: ["Fakultas Teknologi Pertanian", "Universitas Jember"],
  },
};

export function getIaFirstParty(key: string | null | undefined) {
  return IA_FIRST_PARTIES[key === "FAKULTAS" ? "FAKULTAS" : "PRODI"];
}

export type IaLanguage = "ID" | "EN";

/** Teks template dokumen IA per bahasa. Layout tidak berubah — hanya teks. */
export const IA_TEXT: Record<IaLanguage, {
  between: string;
  with: string;
  for: string;
  number: string;
  explanation: string;
  organizer: string;
  partner: string;
  labels: { name: string; position: string; faculty: string; address: string; institution: string };
  agreement: string;
  table: { program: string; personnel: string; time: string; place: string };
  closingIntro: string;
  closingPrograms: string[];
  closingAnd: string;
  closingTail: string;
  leadSuffix: string;
  locale: string;
}> = {
  ID: {
    between: "ANTARA",
    with: "DENGAN",
    for: "UNTUK",
    number: "Nomor",
    explanation: "Dengan ini, kedua belah pihak menjelaskan bahwa:",
    organizer: "Penyelenggara,",
    partner: "Mitra,",
    labels: { name: "Nama", position: "Jabatan", faculty: "Fakultas", address: "Alamat", institution: "Instansi" },
    agreement: "Kedua belah pihak sepakat untuk melaksanakan kegiatan di bawah ini:",
    table: { program: "Program", personnel: "Personil yang terlibat", time: "Waktu", place: "Tempat" },
    closingIntro: "Demikianlah pelaksanaan ini dibuat sebagai acuan pelaksanaan kegiatan, sekaligus sebagai tindak lanjut dari kerjasama antara",
    closingPrograms: ["Program Studi Teknologi Hasil Pertanian", "Program Studi Teknik Pertanian", "Program Studi Teknologi Industri Pertanian", "Magister Teknologi Agroindustri Fakultas Teknologi Pertanian Universitas Jember"],
    closingAnd: "dan",
    closingTail: "",
    leadSuffix: "(ketua)",
    locale: "id-ID",
  },
  EN: {
    between: "BETWEEN",
    with: "AND",
    for: "FOR",
    number: "Number",
    explanation: "Hereby, both parties declare that:",
    organizer: "Organizer,",
    partner: "Partner,",
    labels: { name: "Name", position: "Position", faculty: "Faculty", address: "Address", institution: "Institution" },
    agreement: "Both parties agree to carry out the following activity:",
    table: { program: "Program", personnel: "Personnel involved", time: "Date", place: "Place" },
    closingIntro: "This implementation arrangement is made as a reference for carrying out the activity, and as a follow-up to the cooperation between",
    closingPrograms: ["Study Program of Agricultural Product Technology", "Study Program of Agricultural Engineering", "Study Program of Agricultural Industrial Technology", "Master of Agroindustrial Technology, Faculty of Agricultural Technology, University of Jember"],
    closingAnd: "and",
    closingTail: "",
    leadSuffix: "(lead)",
    locale: "en-GB",
  },
};

export function getIaText(lang: string | null | undefined) {
  return IA_TEXT[lang === "EN" ? "EN" : "ID"];
}

/** Nama institusi pihak pertama per bahasa (untuk kop, identitas, dan ttd). */
export function firstPartyLines(firstParty: { titleLines: string[]; organizer: string; faculty: string; signatureInstitutionLines: string[] }, lang: IaLanguage) {
  if (lang === "EN") {
    const lines: Record<string, { titleLines: string[]; organizer: string; faculty: string; signatureLines: string[] }> = {
      PRODI: { titleLines: ["Agricultural Product Technology Study Program", "Faculty of Agricultural Technology, University of Jember"], organizer: "Agricultural Product Technology Study Program", faculty: "Faculty of Agricultural Technology, University of Jember", signatureLines: ["Agricultural Product Technology", "Faculty of Agricultural Technology", "University of Jember"] },
      FAKULTAS: { titleLines: ["Faculty of Agricultural Technology, University of Jember"], organizer: "Faculty of Agricultural Technology, University of Jember", faculty: "Faculty of Agricultural Technology, University of Jember", signatureLines: ["Faculty of Agricultural Technology", "University of Jember"] },
    };
    const key = firstParty.organizer.startsWith("Fakultas") ? "FAKULTAS" : "PRODI";
    return lines[key];
  }
  return { titleLines: firstParty.titleLines, organizer: firstParty.organizer, faculty: firstParty.faculty, signatureLines: firstParty.signatureInstitutionLines };
}

export function iaClosing(partnerName: string, lang: IaLanguage) {
  const t = IA_TEXT[lang];
  return `${t.closingIntro} ${t.closingPrograms.join(", ")} ${t.closingAnd} ${partnerName}.`;
}

export async function getIaDocumentData(id: string, nomorPreview?: string, langOverride?: string) {
  const activity = await db.activity.findUnique({
    where: { id },
    include: {
      partner: { select: { name: true, level: true, address: true, city: true, picName: true, picPosition: true } },
      students: { orderBy: { order: "asc" } },
      lecturers: { orderBy: { order: "asc" } },
    },
  });
  if (!activity) return null;
  const firstParty = getIaFirstParty(activity.iaFirstParty);
  const partnerLogo = activity.iaPartnerLogoFileId
    ? await getStoredFile(activity.iaPartnerLogoFileId)
    : null;
  const displayNumber = activity.iaNumber || (nomorPreview ? decodeURIComponent(nomorPreview) : "—");
  const partnerName = activity.iaPartnerName || activity.partner.name;
  const partnerPicName = activity.iaPartnerPicName || activity.partnerPic || activity.partner.picName || partnerName;
  const partnerPicPosition = activity.iaPartnerPicPosition || activity.partnerPICPosition || activity.partner.picPosition || "Pihak Mitra";
  const partnerAddress = activity.iaPartnerAddress || [activity.partner.city, activity.partner.address].filter(Boolean).join(", ") || "Indonesia";
  const programName = activity.iaProgramName || activity.title;
  const lang: IaLanguage = (langOverride === "EN" || langOverride === "ID" ? langOverride : activity.iaLanguage) === "EN" ? "EN" : "ID";
  const text = getIaText(lang);
  const fp = firstPartyLines(firstParty, lang);
  // Personil: mahasiswa + dosen (fallback ke dosenName bila tak ada baris dosen) + penanggung jawab mitra
  const personnel = [
    ...activity.students.map(s => s.name),
    ...activity.lecturers.map(l => (l.isLeader ? `${l.name} ${text.leadSuffix}` : l.name)),
    ...(activity.lecturers.length === 0 && activity.dosenName ? [activity.dosenName] : []),
    ...(partnerPicName && partnerPicName !== "—" && partnerPicName !== partnerName ? [partnerPicName] : []),
  ].filter(Boolean);
  return {
    activity,
    firstParty,
    fpLines: fp as { titleLines: string[]; organizer: string; faculty: string; signatureLines: string[] },
    text,
    lang,
    partnerLogo,
    displayNumber,
    isDraft: !activity.iaNumber,
    partnerName,
    partnerPicName,
    partnerPicPosition,
    partnerAddress,
    programName,
    personnel,
  };
}

const longDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });
export function iaDateText(date: Date | null, locale = "id-ID") {
  return date ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date) : "—";
}
