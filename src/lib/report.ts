import { AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import { readFile } from "node:fs/promises";
import path from "node:path";

const FONT = "Bookman Old Style";
/* Folio (21,5 × 33 cm) dalam DXA */
const PAGE_W = 12154;
const PAGE_H = 18709;
const MARGIN_TOP = 1701;   /* 3 cm */
const MARGIN_BOT = 1134;   /* 2 cm */
const MARGIN_LEFT = 1701;  /* 3 cm */
const MARGIN_RIGHT = 1134; /* 2 cm */
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT; /* 9319 */

/* Border helpers */
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const CB = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const;
const TABLE_BORDERS = { top: CB, bottom: CB, left: CB, right: CB, insideHorizontal: CB, insideVertical: CB };

export interface ReportActivity {
  title: string;
  partner: string;
  iaNumber: string | null;
  dateStart: Date | null;
  dateEnd: Date | null;
  studentCount: number;
  lecturerCount: number;
  reportLink: string | null;
}

export interface ReportParams {
  activities: ReportActivity[];
  from: Date | null;
  to: Date | null;
  newPartnerCount: number;
  teamLeaderName: string;
  teamLeaderPosition: string;
}

/* ── date formatting ────────────────────────────────────── */

const BLN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function fd(d: Date | null): string { if (!d) return "-"; return `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`; }
function frange(a: Date | null, b: Date | null): string {
  if (!a && !b) return "Periode ...";
  return a && b ? `Periode ${fd(a)} — ${fd(b)}` : `Periode ${fd(a || b)}`;
}

/* ── paragraph helper ───────────────────────────────────── */

function para(text: string, opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { after?: number; before?: number; line?: number }; justification?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const { bold = false, size = 10, align, spacing, justification } = opts;
  return new Paragraph({
    alignment: align ?? justification,
    spacing,
    children: [new TextRun({ text, font: FONT, size: size * 2, bold })],
  });
}

/* ── table cell ─────────────────────────────────────────── */

function c(text: string, w: number, opts: { bold?: boolean; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const { bold = false, fill, align } = opts;
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align ?? AlignmentType.LEFT,
        children: [new TextRun({ text: text || "-", font: FONT, size: 20, bold })],
      }),
    ],
  });
}

/* ── stat box ───────────────────────────────────────────── */

function statBox(label: string, value: number | string, w: number) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 80, right: 80 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: String(value), font: FONT, size: 24, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: FONT, size: 16, bold: true })] }),
    ],
  });
}

/* ── kop surat ──────────────────────────────────────────── */

async function buildKop(): Promise<Table> {
  let logo: Buffer | null = null;
  try { logo = await readFile(path.join(process.cwd(), "public", "logo-unej.png")); } catch { /* */ }

  const logoW = 1600;
  const textW = CONTENT_W - logoW;

  const logoCell = new TableCell({
    width: { size: logoW, type: WidthType.DXA },
    borders: NO_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: logo
          ? [new ImageRun({ type: "png", data: logo, transformation: { width: 70, height: 70 } })]
          : [new TextRun({ text: "[LOGO]", font: FONT, size: 16, bold: true })],
      }),
    ],
  });

  const txtCell = new TableCell({
    width: { size: textW, type: WidthType.DXA },
    borders: NO_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: [new TextRun({ text: "UNIVERSITAS JEMBER", font: FONT, size: 24, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: [new TextRun({ text: "FAKULTAS TEKNOLOGI PERTANIAN", font: FONT, size: 20, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROGRAM STUDI TEKNOLOGI HASIL PERTANIAN", font: FONT, size: 18, bold: true })] }),
    ],
  });

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [logoW, textW],
    borders: { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 18, color: "000000" } },
    rows: [new TableRow({ children: [logoCell, txtCell] })],
  });
}

/* ── main generator ─────────────────────────────────────── */

export async function generateLaporanWord(p: ReportParams): Promise<Buffer> {
  const { activities: items, from, to, newPartnerCount, teamLeaderName, teamLeaderPosition } = p;

  const totalKegiatan = items.length;
  const totalMitra = new Set(items.map(i => i.partner)).size;
  const totalMahasiswa = items.reduce((s, i) => s + i.studentCount, 0);
  const totalDosen = items.reduce((s, i) => s + i.lecturerCount, 0);

  const kop = await buildKop();

  /* ── lebar kolom tabel kegiatan (auto-sum = CONTENT_W) ── */
  const COL_NO   = 450;
  const COL_NAME = 2200;
  const COL_MITRA= 1400;
  const COL_IA   = 950;
  const COL_TGL  = 1450;
  const COL_MHS  = 500;
  const COL_DSN  = 450;
  const COL_LINK = CONTENT_W - COL_NO - COL_NAME - COL_MITRA - COL_IA - COL_TGL - COL_MHS - COL_DSN;

  const doc = new Document({
    creator: "Tim Kerja Sama Prodi Teknologi Hasil Pertanian",
    title: "Laporan Kegiatan Kerja Sama",
    description: "Laporan internal kegiatan kerja sama Prodi THP, FTP, Universitas Jember.",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20 },
          paragraph: { spacing: { after: 0, line: 240 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOT, left: MARGIN_LEFT, right: MARGIN_RIGHT },
          },
        },
        children: [
          /* ═══ KOP ═══ */
          kop,

          /* ═══ JUDUL ═══ */
          new Paragraph({ spacing: { before: 250, after: 80 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "LAPORAN KEGIATAN KERJA SAMA", font: FONT, size: 24, bold: true })] }),
          new Paragraph({ spacing: { after: 40 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: frange(from, to), font: FONT, size: 20, bold: true })] }),
          new Paragraph({ spacing: { after: 250 }, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Tim Kerja Sama Prodi Teknologi Hasil Pertanian, FTP, Universitas Jember", font: FONT, size: 20 })] }),

          /* ═══ I. RINGKASAN ═══ */
          para("I. RINGKASAN KEGIATAN", { bold: true, size: 11, spacing: { before: 100, after: 120 } }),

          (() => {
            const bw = Math.floor(CONTENT_W / 4);
            return new Table({
              width: { size: CONTENT_W, type: WidthType.DXA },
              layout: TableLayoutType.FIXED,
              columnWidths: [bw, bw, bw, CONTENT_W - 3 * bw],
              borders: TABLE_BORDERS,
              rows: [new TableRow({ children: [
                statBox("Total Kegiatan", totalKegiatan, bw),
                statBox("Mitra Baru", newPartnerCount, bw),
                statBox("Mahasiswa", totalMahasiswa, bw),
                statBox("Dosen", totalDosen, CONTENT_W - 3 * bw),
              ] })],
            });
          })(),

          new Paragraph({ spacing: { before: 100, after: 200 }, children: [
            new TextRun({ text: "Total mitra yang diimplementasikan: ", font: FONT, size: 20, bold: true }),
            new TextRun({ text: String(totalMitra), font: FONT, size: 20 }),
          ] }),

          /* ═══ II. DAFTAR KEGIATAN ═══ */
          para("II. DAFTAR KEGIATAN KERJA SAMA", { bold: true, size: 11, spacing: { before: 100, after: 120 } }),

          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            columnWidths: [COL_NO, COL_NAME, COL_MITRA, COL_IA, COL_TGL, COL_MHS, COL_DSN, COL_LINK],
            borders: TABLE_BORDERS,
            rows: [
              /* HEADER */
              new TableRow({ tableHeader: true, children: [
                c("No.", COL_NO, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Nama Kegiatan", COL_NAME, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Mitra", COL_MITRA, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Nomor IA", COL_IA, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Tanggal Pelaksanaan", COL_TGL, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Mhs", COL_MHS, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Dsn", COL_DSN, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
                c("Link Dokumentasi", COL_LINK, { bold: true, align: AlignmentType.CENTER, fill: "D9E1F2" }),
              ] }),

              /* DATA ROWS */
              ...items.map((item, idx) => {
                const tgl = item.dateStart && item.dateEnd
                  ? (item.dateStart.getTime() === item.dateEnd.getTime() ? fd(item.dateStart) : `${fd(item.dateStart)} — ${fd(item.dateEnd)}`)
                  : item.dateStart ? fd(item.dateStart) : "-";
                return new TableRow({ children: [
                  c(String(idx + 1), COL_NO, { align: AlignmentType.CENTER }),
                  c(item.title, COL_NAME),
                  c(item.partner, COL_MITRA),
                  c(item.iaNumber || "-", COL_IA, { align: AlignmentType.CENTER }),
                  c(tgl, COL_TGL, { align: AlignmentType.CENTER }),
                  c(String(item.studentCount), COL_MHS, { align: AlignmentType.CENTER }),
                  c(String(item.lecturerCount), COL_DSN, { align: AlignmentType.CENTER }),
                  c(item.reportLink || "-", COL_LINK),
                ] });
              }),
            ],
          }),

          /* ═══ PENUTUP ═══ */
          new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: "Demikian laporan ini dibuat sebagai bahan evaluasi dan pelaporan kegiatan kerja sama.", font: FONT, size: 20 })] }),

          /* ═══ TANDA TANGAN ═══ */
          (() => {
            const sigW = Math.round(CONTENT_W * 0.4);
            const emptyW = CONTENT_W - sigW;
            return new Table({
              width: { size: CONTENT_W, type: WidthType.DXA },
              layout: TableLayoutType.FIXED,
              columnWidths: [emptyW, sigW],
              borders: NO_BORDERS,
              rows: [new TableRow({ children: [
                new TableCell({ width: { size: emptyW, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] }),
                new TableCell({
                  width: { size: sigW, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 },
                      children: [new TextRun({ text: "Ketua Tim Kerja Sama", font: FONT, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 },
                      children: [new TextRun({ text: "Prodi Teknologi Hasil Pertanian", font: FONT, size: 20 })] }),
                    new Paragraph({ spacing: { before: 600, after: 600 }, children: [new TextRun({ text: " ", font: FONT, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: teamLeaderName, font: FONT, size: 20, bold: true, underline: {} })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: teamLeaderPosition, font: FONT, size: 20 })] }),
                  ],
                }),
              ] })],
            });
          })(),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
