"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileSignature, FileText, FileUp, Plus, Trash2, X } from "lucide-react";

interface Partner { id: string; name: string; level: string; picName: string | null; picPosition: string | null; logoFileId: string | null; }

type State = "idle" | "submitting" | "done";

export default function IaDirectForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [partnerQuery, setPartnerQuery] = useState("");
  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);
  const [newMode, setNewMode] = useState(false);

  // New partner fields
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPicName, setNewPicName] = useState("");
  const [newPicPosition, setNewPicPosition] = useState("");
  const [newLogoFileId, setNewLogoFileId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [proposalLogoFileId, setProposalLogoFileId] = useState<string | null>(null);
  const [uploadingProposalLogo, setUploadingProposalLogo] = useState(false);
  const [proposalLogoName, setProposalLogoName] = useState<string | null>(null);

  // Activity fields
  const [programName, setProgramName] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [location, setLocation] = useState("");
  const [personil, setPersonil] = useState<string[]>([""]);
  const [firstParty, setFirstParty] = useState<"PRODI" | "FAKULTAS">("PRODI");
  const [lang, setLang] = useState<"ID" | "EN">("ID");

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/ia-direct-list").then(r => r.json()).then(d => { if (d.partners) setPartners(d.partners); }).catch(() => {});
  }, [open]);

  async function submit() {
    if (!selectedPartnerId && !newName) return;
    if (!programName.trim() || !dateStart || !dateEnd) return;
    const selectedP = partners.find(p => p.id === selectedPartnerId);
    if (!newMode && !selectedP?.logoFileId && !proposalLogoFileId) { setMessage("Logo mitra belum diunggah. Tambahkan logo terlebih dahulu pada data mitra atau upload logo melalui form."); return; }
    if (personil.filter(Boolean).length === 0) { setMessage("Minimal satu personil wajib diisi."); return; }
    setState("submitting"); setMessage("");

    // 1. Create partner if new mode
    let partnerId = selectedPartnerId;
    if (newMode && newName.trim()) {
      const partnerRes = await fetch("/api/admin/ia-direct-create-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          level: "NASIONAL",
          address: newAddress || null,
          picName: newPicName || null,
          picPosition: newPicPosition || null,
          logoFileId: newLogoFileId,
          source: "IA_DIRECT",
        }),
      });
      const pd = await partnerRes.json();
      if (!partnerRes.ok || !pd.partner?.id) {
        setMessage(pd.error || "Gagal menyimpan mitra baru.");
        setState("idle"); return;
      }
      partnerId = pd.partner.id;
    }
    if (!partnerId) { setMessage("Pilih mitra atau lengkapi data mitra baru."); setState("idle"); return; }

    // 2. Create activity
    const picName = newMode ? (newPicName || newName) : (selectedP?.picName || selectedP?.name || "");
    const picPos = newMode ? (newPicPosition || "Pihak Mitra") : (selectedP?.picPosition || "Pihak Mitra");

    const payload = {
      partnerId,
      programName: programName.trim(),
      dateStart,
      dateEnd,
      location: location || null,
      personil: personil.filter(Boolean).map(name => ({ name })),
      firstParty,
      lang,
      partnerPIC: picName,
      partnerPICPosition: picPos,
      source: "IA_DIRECT",
      proposalLogoFileId: (partners.find(p => p.id === selectedPartnerId)?.logoFileId || newMode) ? undefined : (proposalLogoFileId || undefined),
    };

    const res = await fetch("/api/admin/ia-direct-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (res.ok && d.ok) {
      setState("done");
      setMessage(`IA "${programName}" berhasil dibuat. Langsung masuk antrean penerbitan.`);
      // Reset
      setProgramName(""); setDateStart(""); setDateEnd(""); setLocation("");
      setPersonil([""]); setSelectedPartnerId(""); 
      setNewMode(false); setNewName(""); setNewAddress(""); setNewPicName(""); setNewPicPosition(""); setNewLogoFileId(null);
      onDone();
    } else {
      setMessage(d.error || "Gagal membuat IA.");
      setState("idle");
    }
  }


  async function uploadProposalLogo(file: File) {
    setUploadingProposalLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/files/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setMessage(data.error || "Upload logo gagal."); return; }
      setProposalLogoFileId(data.fileId);
      setProposalLogoName(file.name);
    } catch { setMessage("Upload logo gagal. Periksa koneksi lalu coba lagi."); }
    finally { setUploadingProposalLogo(false); }
  }

  async function uploadLogo(file: File) {
    if (!newMode) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/files/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setMessage(data.error || "Upload logo gagal."); return; }
      setNewLogoFileId(data.fileId);
    } catch { setMessage("Upload logo gagal. Periksa koneksi lalu coba lagi."); }
    finally { setUploadingLogo(false); }
  }

  if (!open) {
    return (
      <section className="rounded-2xl border border-stone-100 bg-white shadow-sm">
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between p-5 text-left">
          <div>
            <h2 className="font-bold text-stone-900">Buat IA Langsung</h2>
            <p className="mt-0.5 text-xs text-stone-500">Untuk kegiatan dadakan tanpa pengajuan mahasiswa</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">+ Buat IA</span>
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-blue-100 p-5">
        <div>
          <h2 className="font-bold text-blue-900">Buat IA Langsung</h2>
          <p className="mt-0.5 text-xs text-stone-500">Untuk kegiatan dadakan tanpa pengajuan mahasiswa</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-xs text-stone-400 hover:text-stone-700">Tutup</button>
      </div>

      {message && (
        <div className={`mx-5 mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${state === "done" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message}
        </div>
      )}

      <div className="space-y-5 p-5">
        {/* BLOK MITRA */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-700">Mitra</h3>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setNewMode(false); setSelectedPartnerId(""); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${!newMode ? "border-blue-300 bg-blue-50 text-blue-700" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>
              Pilih Mitra
            </button>
            <button type="button" onClick={() => { setNewMode(true); setSelectedPartnerId(""); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${newMode ? "border-blue-300 bg-blue-50 text-blue-700" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>
              + Mitra Baru
            </button>
          </div>

          {!newMode ? (
            <div className="space-y-1">
              <input
                type="text"
                value={partnerQuery}
                onChange={e => { setPartnerQuery(e.target.value); setSelectedPartnerId(""); setPartnerSearchOpen(true); }}
                onFocus={() => setPartnerSearchOpen(true)}
                placeholder="Ketik nama mitra..."
                className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-emerald-400"
              />
              {partnerSearchOpen && !selectedPartnerId && (() => {
                const filtered = partners.filter(p => p.name.toLowerCase().includes(partnerQuery.toLowerCase()));
                return filtered.length > 0 ? (
                  <div className="max-h-40 overflow-auto rounded-xl border border-stone-100 bg-white p-1 shadow">
                    {filtered.slice(0, 10).map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelectedPartnerId(p.id); setPartnerQuery(p.name); setPartnerSearchOpen(false); }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700">
                        {p.name} <span className="ml-2 text-xs text-stone-400">{p.level}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                    Mitra tidak ditemukan. <button type="button" onClick={() => { setNewMode(true); setNewName(partnerQuery); setPartnerSearchOpen(false); }} className="ml-2 font-semibold text-emerald-700 hover:underline">+ Buat mitra baru</button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-stone-700">Nama instansi mitra *</span>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="PT Nusantara Jaya"
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-stone-700">Alamat (opsional)</span>
                  <input value={newAddress} onChange={e => setNewAddress(e.target.value)}
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-stone-700">Nama PIC mitra</span>
                  <input value={newPicName} onChange={e => setNewPicName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-stone-700">Jabatan PIC</span>
                  <input value={newPicPosition} onChange={e => setNewPicPosition(e.target.value)} placeholder="Kepala Bidang"
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                </label>
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-stone-700">Logo mitra * {uploadingLogo && <span className="font-normal text-stone-400">Mengunggah...</span>}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} className="h-10 w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100" />
                {newLogoFileId && <p className="mt-1 text-xs text-emerald-600">✓ Logo berhasil diunggah</p>}
                {!newLogoFileId && !uploadingLogo && <p className="mt-1 text-xs text-amber-600">Logo wajib diunggah sebelum membuat mitra</p>}
              </div>
            </div>
          )}

          {/* Logo */}
          <div onClick={() => setPartnerSearchOpen(false)}>
          {!newMode && selectedPartnerId && !partners.find(p => p.id === selectedPartnerId)?.logoFileId && <div className="rounded-xl border border-stone-100 bg-stone-50 p-3"><p className="text-sm font-semibold text-stone-800">Logo Mitra</p><div className="mt-2 flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"><FileUp className="h-4 w-4" /> Pilih Logo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProposalLogo(f); }} /></label>{proposalLogoFileId ? <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><FileText className="h-4 w-4" /> Logo terunggah<button type="button" onClick={() => setProposalLogoFileId(null)} className="text-emerald-600 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></span> : <span className="text-xs text-stone-400">Belum ada logo</span>}{uploadingProposalLogo && <span className="text-xs text-emerald-700">Mengunggah...</span>}</div><p className="mt-2 text-xs text-stone-500">Jika mitra belum memiliki logo, Anda dapat menguploadnya di sini.</p></div>}
          {!newMode && selectedPartnerId && partners.find(p => p.id === selectedPartnerId)?.logoFileId && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Logo mitra tersedia dan akan otomatis dipakai untuk IA.</p>}
          </div>
        </div>

        {/* BLOK KEGIATAN */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-700">Kegiatan</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-700">Nama program *</span>
              <input value={programName} onChange={e => setProgramName(e.target.value)} placeholder="Kerja Sama Penelitian Komoditas Kakao"
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-700">Tempat</span>
              <input value={location} onChange={e => setLocation(e.target.value)}
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-700">Tanggal mulai *</span>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-700">Tanggal selesai *</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-xs font-semibold text-stone-700">Pihak pertama</span>
              <div className="flex gap-3">
                {(["PRODI", "FAKULTAS"] as const).map(k => (
                  <button key={k} type="button" onClick={() => setFirstParty(k)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${firstParty === k ? "border-blue-300 bg-blue-50 text-blue-700" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>
                    {k === "PRODI" ? "Prodi THP" : "Fakultas"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-stone-700">Bahasa dokumen</span>
              <div className="flex gap-3">
                {(["ID", "EN"] as const).map(l => (
                  <button key={l} type="button" onClick={() => setLang(l)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${lang === l ? "border-blue-300 bg-blue-50 text-blue-700" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>
                    {l === "ID" ? "🇮🇩 Indonesia" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PERSONIL */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-700">Personil yang terlibat</h3>
          <p className="text-xs text-stone-400">Masukkan nama lengkap — akan tampil di daftar personil dokumen IA</p>
          <div className="space-y-2">
            {personil.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input value={p} onChange={e => setPersonil(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                  placeholder={`Personil ${i + 1}`} className="h-10 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm" />
                {personil.length > 1 && (
                  <button type="button" onClick={() => setPersonil(prev => prev.filter((_, j) => j !== i))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setPersonil(prev => [...prev, ""])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-50">
            <Plus className="h-3.5 w-3.5" /> Tambah Personil
          </button>
        </div>

        {/* SUBMIT */}
        <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
          <button type="button" onClick={() => void submit()} disabled={state === "submitting" || !programName.trim() || !dateStart || !dateEnd}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors">
            <FileSignature className="h-4 w-4" />
            {state === "submitting" ? "Membuat..." : "Buat IA & Masuk Antrean"}
          </button>
        </div>
      </div>
    </section>
  );
}
