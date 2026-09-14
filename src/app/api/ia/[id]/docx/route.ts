import { AlignmentType, BorderStyle, Document, HeightRule, ImageRun, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun, UnderlineType, WidthType } from "docx";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getIaDocumentData, iaDateText, iaClosing, firstPartyLines } from "@/lib/ia";

export const dynamic = "force-dynamic";

const FONT = "Bookman Old Style";
const SIZE = 20;
const TITLE_SIZE = 22;
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 20160;
const CONTENT_WIDTH = 9360;
const LABEL_WIDTH = 3080;
const COLON_WIDTH = 289;
const VALUE_WIDTH = 5991;
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };
const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const TABLE_BORDERS = { top: TABLE_BORDER, bottom: TABLE_BORDER, left: TABLE_BORDER, right: TABLE_BORDER, insideHorizontal: TABLE_BORDER, insideVertical: TABLE_BORDER };

type Logo = { data: Buffer; mimeType: string } | null;

function run(text: string, opts: Record<string, unknown> = {}) {
  return new TextRun({ text, font: FONT, size: SIZE, ...opts });
}
function titleRun(text: string, opts: Record<string, unknown> = {}) {
  return new TextRun({ text, font: FONT, size: TITLE_SIZE, ...opts });
}
function para(children: TextRun[] | string, opts: Record<string, unknown> = {}) {
  return new Paragraph({ children: Array.isArray(children) ? children : [run(children)], ...opts });
}
function blankLine() {
  return new Paragraph({ children: [], spacing: { after: 0, line: 240 } });
}
function valueCell(text: string, width: number, opts: { borders?: typeof TABLE_BORDERS | typeof NO_BORDERS; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, borders: opts.borders ?? NO_BORDERS, children: [para(text, opts.alignment ? { alignment: opts.alignment } : {})] });
}
function identityTable(rows: [string, string][]) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH, COLON_WIDTH, VALUE_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    rows: rows.map(([label, value]) => new TableRow({ cantSplit: true, children: [valueCell(label, LABEL_WIDTH), valueCell(":", COLON_WIDTH), valueCell(value || "—", VALUE_WIDTH)] })),
  });
}
function activityTable(rows: [string, string | string[]][]) {
  const borderedCell = (text: string, width: number) => valueCell(text, width, { borders: TABLE_BORDERS });
  const borderedCellMulti = (value: string | string[], width: number) => new TableCell({
    width: { size: width, type: WidthType.DXA }, borders: TABLE_BORDERS,
    children: Array.isArray(value) ? value.map(v => para(v)) : [para(value)],
  });
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [2297, 287, 6776],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: rows.map(([label, value]) => new TableRow({ cantSplit: true, children: [
      borderedCell(label, 2297), borderedCell(":", 287), borderedCellMulti(value, 6776),
    ] })),
  });
}
function logoRun(logo: Logo) {
  if (!logo || !["image/png", "image/jpeg"].includes(logo.mimeType)) return null;
  return new ImageRun({ type: logo.mimeType === "image/jpeg" ? "jpg" : "png", data: logo.data, transformation: { width: 82, height: 82 } });
}
async function readUnejLogo(): Promise<Logo> {
  try { return { data: await readFile(path.join(process.cwd(), "public", "logo-unej.png")), mimeType: "image/png" }; } catch { return null; }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const nomor = new URL(request.url).searchParams.get("nomor") || undefined;
    const langParam = new URL(request.url).searchParams.get("lang") || undefined;
    const data = await getIaDocumentData(id, nomor, langParam);
    if (!data) return new Response("Dokumen IA tidak ditemukan", { status: 404 });
    const { activity, firstParty, fpLines, text, lang, partnerLogo, displayNumber, partnerName, partnerPicName, partnerPicPosition, partnerAddress, programName, personnel } = data;
    const closing = iaClosing(partnerName, lang);
    const unejLogo = await readUnejLogo();
    const partner = partnerLogo ? { data: Buffer.from(partnerLogo.data), mimeType: partnerLogo.mimeType } : null;

    const logoCell = (logo: Logo, label: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]) => {
      const image = logoRun(logo);
      return new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ alignment, children: image ? [image] : [run(label, { size: 14 })] })] });
    };
    const logoTable = new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [4680, 4680], borders: NO_BORDERS, layout: TableLayoutType.FIXED,
      rows: [new TableRow({ cantSplit: true, children: [logoCell(unejLogo, "Logo UNEJ", AlignmentType.RIGHT), logoCell(partner, "Logo mitra", AlignmentType.LEFT)] })],
    });

    const SIGNATURE_WIDTH = 4680;
    const signatureLine = (text: string, bold = false) => new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 },
      children: [run(text, bold ? { bold: true, underline: { type: UnderlineType.SINGLE } } : {})],
    });
    const signatureCell = (children: Paragraph[]) => new TableCell({
      width: { size: SIGNATURE_WIDTH, type: WidthType.DXA }, borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 120, right: 120 },
      children,
    });
    const signatureSpacer = () => new TableCell({
      width: { size: SIGNATURE_WIDTH, type: WidthType.DXA }, borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 120, right: 120 },
      children: [new Paragraph({ children: [], spacing: { after: 0, line: 240 } })],
    });
    const signatures = new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [SIGNATURE_WIDTH, SIGNATURE_WIDTH], borders: NO_BORDERS, layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ cantSplit: true, children: [
          signatureCell((fpLines.signatureLines || firstParty.signatureInstitutionLines).map(line => signatureLine(line))),
          signatureCell([signatureLine(partnerName)]),
        ] }),
        new TableRow({ height: { value: 1400, rule: HeightRule.ATLEAST }, children: [signatureSpacer(), signatureSpacer()] }),
        new TableRow({ cantSplit: true, children: [
          signatureCell([signatureLine(firstParty.signerName, true)]),
          signatureCell([signatureLine(partnerPicName, true)]),
        ] }),
        new TableRow({ cantSplit: true, children: [
          signatureCell([signatureLine(firstParty.signerPosition)]),
          signatureCell([signatureLine(partnerPicPosition)]),
        ] }),
      ],
    });

    const bluLogo = await readFile(path.join(process.cwd(), "public", "logo-blu.png")).catch(() => null);
    const bluImage = bluLogo ? new ImageRun({
      type: "png",
      data: bluLogo,
      transformation: { width: 82, height: 82 },
    }) : null;
    const bluParagraph = bluImage ? new Paragraph({ alignment: AlignmentType.RIGHT, children: [bluImage] }) : null;

    const children: (Paragraph | Table)[] = [
      logoTable,
      blankLine(),
      para("IMPLEMENTATION OF ARRANGEMENT", { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 }, children: [titleRun("IMPLEMENTATION OF ARRANGEMENT", { bold: true, underline: { type: UnderlineType.SINGLE } })] }),
      para(text.between, { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 } }),
      ...fpLines.titleLines.map(line => para(line.toUpperCase(), { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 }, children: [run(line.toUpperCase(), { bold: true })] })),
      para(text.with, { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 } }),
      para(partnerName.toUpperCase(), { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 }, children: [run(partnerName.toUpperCase(), { bold: true })] }),
      para(text.for, { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 } }),
      para(programName.toUpperCase(), { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 }, children: [run(programName.toUpperCase(), { bold: true })] }),
      para(`${text.number} ${displayNumber}`, { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 360 }, children: [run(`${text.number} ${displayNumber}`, { bold: true })] }),
      blankLine(),
      para(text.explanation, { spacing: { after: 0, line: 240 } }),
      para(text.organizer, { spacing: { after: 0, line: 240 }, children: [run(text.organizer, { bold: true })] }),
      para(fpLines.organizer, { spacing: { after: 0, line: 240 } }),
      identityTable([
        [text.labels.name, firstParty.signerName],
        [text.labels.position, firstParty.signerPosition],
        [text.labels.faculty, fpLines.faculty],
        [text.labels.address, firstParty.address],
      ]),
      para(text.partner, { spacing: { after: 0, line: 240 }, children: [run(text.partner, { bold: true })] }),
      para(partnerName, { spacing: { after: 0, line: 240 } }),
      identityTable([
        [text.labels.name, partnerPicName],
        [text.labels.position, partnerPicPosition],
        [text.labels.institution, partnerName],
        [text.labels.address, partnerAddress],
      ]),
      blankLine(),
      para(text.agreement, { spacing: { after: 0, line: 240 } }),
      activityTable([
        [text.table.program, programName],
        [text.table.personnel, personnel],
        [text.table.time, `${iaDateText(activity.dateStart, text.locale)}-${iaDateText(activity.dateEnd, text.locale)}`],
        [text.table.place, activity.location || "—"],
      ]),
      blankLine(),
      para(closing, { alignment: AlignmentType.JUSTIFIED, spacing: { after: 0, line: 240 } }),
      blankLine(),
      para(`Jember, ${iaDateText(activity.createdAt, text.locale)}`, { indent: { left: 4320, firstLine: 720 }, spacing: { after: 0, line: 240 } }),
      signatures,
      ...(bluParagraph ? [bluParagraph] : []),
    ];

    const doc = new Document({
      styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
      sections: [{ properties: { page: { size: { width: PAGE_WIDTH, height: PAGE_HEIGHT }, margin: { top: 1070, right: 1440, bottom: 426, left: 1440, header: 709, footer: 709 } } }, children }],
    });
    const buffer = await Packer.toBuffer(doc);
    const filename = `${(displayNumber === "—" ? "IA-DRAFT" : displayNumber).replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")}.docx`;
    return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("IA docx generation error:", error);
    return new Response("Gagal menghasilkan dokumen Word IA", { status: 500 });
  }
}
