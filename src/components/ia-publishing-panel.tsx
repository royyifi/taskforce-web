"use client";

import { useEffect, useState } from "react";
import IaPublishing, { type IaItem } from "@/components/ia-publishing";

export default function IaPublishingPanel() {
  const [waiting, setWaiting] = useState<IaItem[]>([]);
  const [issued, setIssued] = useState<IaItem[]>([]);
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
    }
  }

  useEffect(() => { void load(); }, []);
  function flash(text: string, type: "info" | "error" = "info") { setMessageType(type); setMessage(text); }

  return <>
    {message && <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}
    <IaPublishing waiting={waiting} issued={issued} busy={busy} setBusy={setBusy} flash={flash} reload={load} />
  </>;
}
