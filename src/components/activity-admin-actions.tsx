"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function ActivityAdminActions({ activityId, activityName }: { activityId: string; activityName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`Hapus kegiatan "${activityName}"? Data yang dihapus tidak dapat dikembalikan.`)) return;
    setError("");
    setLoading(true);
    const response = await fetch(`/api/admin/activities/${activityId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Kegiatan gagal dihapus.");
      setLoading(false);
      return;
    }
    router.push("/kegiatan");
    router.refresh();
  }

  return <div className="flex flex-col items-stretch gap-2 sm:items-end">
    <button type="button" onClick={() => void remove()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60">
      <Trash2 className="h-3.5 w-3.5" /> {loading ? "Menghapus..." : "Hapus Kegiatan"}
    </button>
    {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
  </div>;
}
