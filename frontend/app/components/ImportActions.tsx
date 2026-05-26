"use client";

import { Inbox, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";

type Props = {
  onDone: () => Promise<void>;
};

export default function ImportActions({ onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload selhal");
      setMessage(data.message || "Report byl zpracován");
      setFile(null);
      await onDone();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runImap() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/imap/run-now", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "IMAP import selhal");
      setMessage(`IMAP import: ${data.status}, přílohy: ${data.processed_attachments || 0}`);
      await onDone();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">Import reportů</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Ruční upload XML/ZIP/GZ nebo okamžité načtení z IMAP mailboxu.</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UploadCloud size={22} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50">
            <span className="truncate text-sm font-bold text-slate-700">{file ? file.name : "Vybrat XML / ZIP / GZ soubor"}</span>
            <input className="hidden" type="file" accept=".xml,.zip,.gz" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" onClick={upload} disabled={!file || loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
              Nahrát report
            </button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400" onClick={runImap} disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Inbox size={17} />}
              Spustit IMAP import
            </button>
          </div>
        </div>

        {(message || error) && (
          <div className={error ? "rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" : "rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"}>
            {message || error}
          </div>
        )}
      </div>
    </section>
  );
}
