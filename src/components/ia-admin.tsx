"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import IaPublishing from "@/components/ia-publishing";
import IaCompletion from "@/components/ia-completion";

interface IaItem {
  id: string; activityCode: string | null; title: string; partnerName: string; submittedBy: string | null; submitterUnit: string | null;
  dateStart: string | null; dateEnd: string | null; students: string[]; iaNumber: string | null; iaUrl: string | null; iaConfirmedAt: string | null;
  reportDate: string | null; reportSummary: string | null; reportLink: string | null; iaStatus?: string | null; iaReviewNote?: string | null;
  iaPartnerPicName?: string | null; iaPartnerPicPosition?: string | null; hasLogo?: boolean; spmUrl?: string | null;
  iaLanguage?: string | null; source?: string | null;
  hasReport?: boolean; hasDocs?: boolean; hasIa?: boolean; photoUrl?: string | null;
}

export { type IaItem };

export default function IaAdmin() {
  const [waiting, setWaiting] = useState<IaItem[]>([]);
  const [issued, setIssued] = useState<IaItem[]>([]);
  const [completion, setCompletion] = useState<IaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");

  async function load() {
    const res = await fetch("/api/admin/ia");
    if (res.status === 401) { window.location.href = "/login"; return; }
    if (res.ok) {
      const d = await res.json();
      setWaiting(d.waiting || []);
      setIssued(d.issued || []);
      setCompletion(d.completion || []);
    }
  }
  useEffect(() => { void load(); }, []);
  function flash(text: string, type: "info" | "error" = "info") { setMessageType(type); setMessage(text); }

  return <>
    {message && (
      <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
        {messageType === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        {message}
      </div>
    )}
    <IaPublishing waiting={waiting} issued={issued} busy={busy} setBusy={setBusy} flash={flash} reload={load} />
    <IaCompletion completion={completion} busy={busy} setBusy={setBusy} flash={flash} reload={load} />
  </>;
}
