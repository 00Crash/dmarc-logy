"use client";

import { FileArchive, Inbox, Loader2, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";

type Props = {
  onDone: () => Promise<void>;
};

export default function ImportActions({ onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function pickFile(selected?: File | null) {
    if (!selected) return;
    setFile(selected);
    setMessage("");
    setError("");
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

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
      setMessage("Report nahrán");
      setFile(null);
      await onDone();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
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
      setMessage("IMAP import hotový");
      await onDone();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Import</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">XML, ZIP nebo GZ</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UploadCloud size={22} />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".xml,.zip,.gz"
        className="hidden"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`cursor-pointer rounded-[1.5rem] border border-dashed p-6 transition ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/60"}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <FileArchive size={22} />
          </div>
          <div className="mt-4 text-sm font-bold text-slate-950">{file ? file.name : "Přetáhněte soubor sem"}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">nebo klikněte pro výběr</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={upload}
          disabled={!file || loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {loading ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
          Nahrát
        </button>

        <button
          type="button"
          onClick={runImap}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {loading ? <Loader2 className="animate-spin" size={17} /> : <Inbox size={17} />}
          IMAP
        </button>
      </div>

      {(message || error) && (
        <div className={error ? "mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" : "mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"}>
          {error || message}
        </div>
      )}
    </section>
  );
}
