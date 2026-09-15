import { notFound } from "next/navigation";
import PrintButton from "@/components/print-button";
import { getIaDocumentData, iaDateText } from "@/lib/ia";
import type { IaLanguage } from "@/lib/ia";

export const dynamic = "force-dynamic";

function logoSrc(logo: { mimeType: string; data: Uint8Array } | null) {
  return logo ? `data:${logo.mimeType};base64,${Buffer.from(logo.data).toString("base64")}` : null;
}

export default async function IaDocumentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nomor?: string; lang?: string }> }) {
  const { id } = await params;
  const { nomor, lang } = await searchParams;
  const data = await getIaDocumentData(id, nomor, lang);
  if (!data) notFound();

  const { activity, firstParty, fpLines, text, lang: resolvedLang, partnerLogo, displayNumber, isDraft, partnerName, partnerPicName, partnerPicPosition, partnerAddress, programName, personnel } = data;

  const partnerLogoUrl = logoSrc(partnerLogo);
  const closing = (() => {
    const t = text;
    return `${t.closingIntro} ${t.closingPrograms.join(", ")} ${t.closingAnd} ${partnerName}.`;
  })();

  return <div className="min-h-screen bg-stone-200 py-8 print:bg-white print:py-0">
    <style>{`@page { size: legal portrait; margin: 0; } @media print { html, body { width: 215.9mm !important; min-height: 355.6mm !important; background: white !important; } body > header, body > footer, .no-print { display: none !important; } body > main { min-height: 0 !important; } .print-sheet { width: 215.9mm !important; height: 355.6mm !important; min-height: 355.6mm !important; box-sizing: border-box !important; overflow: hidden !important; box-shadow: none !important; margin: 0 !important; } }`}</style>
    <div className="mx-auto max-w-[216mm] px-4 print:px-0">
      <div className="no-print mb-4 flex flex-wrap items-center justify-end gap-2">
        {isDraft && <span className="mr-auto rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">DRAFT — belum diterbitkan resmi</span>}
        {resolvedLang === "EN" && <span className="mr-auto rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800">🇬🇧 English version</span>}
        <PrintButton />
        <a href={`/api/ia/${id}/docx?${new URLSearchParams({ ...(nomor ? { nomor } : {}), ...(lang ? { lang } : {}) }).toString()}`} className="inline-flex items-center rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Unduh Word (.docx)</a>
      </div>

      <main className="print-sheet relative bg-white px-[25mm] pb-[8mm] pt-[8mm] shadow-lg print:px-[25.4mm] print:pb-[7.5mm] print:pt-[18.8mm]" style={{ minHeight: "356mm", fontFamily: '"Bookman Old Style", Georgia, serif', fontSize: "10pt", lineHeight: 1.25 }}>
        <header className="flex h-[27mm] items-start justify-center gap-[2mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-unej.png" alt="Logo Universitas Jember" className="h-[25mm] w-[27mm] object-contain" />
          {partnerLogoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={partnerLogoUrl} alt={`Logo ${partnerName}`} className="h-[25mm] w-[27mm] object-contain" /> : <div className="flex h-[25mm] w-[27mm] items-center justify-center text-center text-[8px] text-stone-400">Logo mitra</div>}
        </header>

        <section className="mt-[9mm] text-center font-bold">
          <p className="underline text-[11pt]">IMPLEMENTATION OF ARRANGEMENT</p>
          <p className="mt-[7mm]">{text.between}</p>
          {fpLines.titleLines.map((line, i) => <p key={i} className={i === 0 ? "mt-[3mm]" : ""}>{line.toUpperCase()}</p>)}
          <p className="mt-[7mm]">{text.with}</p>
          <p className="mt-[3mm]">{partnerName.toUpperCase()}</p>
          <p className="mt-[7mm]">{text.for}</p>
          <p className="mt-[3mm]">{programName.toUpperCase()}</p>
          <p className="mt-[6mm] font-normal">{text.number} {displayNumber}</p>
        </section>

        <section className="mt-[8mm]">
          <p>{text.explanation}</p>
          <p className="mt-[4mm] font-bold">{text.organizer}</p>
          <p>{fpLines.organizer}</p>
          <IdentityRows labels={[text.labels.name, text.labels.position, text.labels.faculty, text.labels.address]} values={[firstParty.signerName, firstParty.signerPosition, fpLines.faculty, firstParty.address]} />
          <p className="mt-[4mm] font-bold">{text.partner}</p>
          <p>{partnerName}</p>
          <IdentityRows labels={[text.labels.name, text.labels.position, text.labels.institution, text.labels.address]} values={[partnerPicName, partnerPicPosition, partnerName, partnerAddress]} />
        </section>

        <section className="mt-[6mm]">
          <p>{text.agreement}</p>
          <table className="mt-[2mm] w-full border-collapse"><tbody>
            <ActivityRow label={text.table.program} value={programName} />
            <ActivityRow label={text.table.personnel} value={personnel.length ? personnel.map((name, i) => <div key={i}>{name}</div>) : "—"} />
            <ActivityRow label={text.table.time} value={activity.dateStart && activity.dateEnd && activity.dateStart.getTime() === activity.dateEnd.getTime() ? iaDateText(activity.dateStart, text.locale) : `${iaDateText(activity.dateStart, text.locale)}-${iaDateText(activity.dateEnd, text.locale)}`} />
            <ActivityRow label={text.table.place} value={activity.location || "—"} />
          </tbody></table>
        </section>

        <p className="mt-[7mm] text-justify">{closing}</p>

        <section className="mt-[7mm]">
          <p className="text-right">Jember, {iaDateText(activity.createdAt, text.locale)}</p>
          <table className="mt-[2mm] w-full border-collapse text-center"><tbody><tr>
            <td className="w-1/2 align-top px-2"><p>{fpLines.signatureLines.map((line, i) => <span key={i} className="block">{line}</span>)}</p><div className="h-[25mm]" /><p className="font-bold underline">{firstParty.signerName}</p><p>{firstParty.signerPosition}</p></td>
            <td className="w-1/2 align-top px-2"><p>{partnerName}</p><div className="h-[25mm]" /><p className="font-bold underline">{partnerPicName}</p><p>{partnerPicPosition}</p></td>
          </tr></tbody></table>
        </section>

        <img src="/logo-blu.png" alt="Lambang BLU" className="pointer-events-none absolute bottom-[8mm] right-[6mm] h-[22mm] w-[22mm]" />
      </main>
    </div>
  </div>;
}

function IdentityRows({ labels, values }: { labels: string[]; values: string[] }) {
  return <dl className="grid grid-cols-[35mm_4mm_1fr]">{labels.map((label, i) => <div key={label} className="contents"><dt>{label}</dt><dd>:</dd><dd>{values[i] || "—"}</dd></div>)}</dl>;
}

function ActivityRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <tr><td className="w-[25%] align-top">{label}</td><td className="w-[4%] align-top">:</td><td className="align-top">{value}</td></tr>;
}

