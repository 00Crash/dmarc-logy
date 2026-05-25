"use client";

import { useRef, useState } from "react";

type Props = {
  onDone: () => Promise<void>;
};

export default function ImportActions({ onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      setMessage("Nahráno");
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
      setMessage("Import hotový");
      await onDone();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        ref={fileRef}
        type="file"
        accept=".xml,.zip,.gz"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        {file ? file.name : "Vybrat soubor"}
      </button>

      <button
        type="button"
        onClick={upload}
        disabled={!file || loading}
        className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        Nahrát
      </button>

      <button
        type="button"
        onClick={runImap}
        disabled={loading}
        className="h-11 rounded-2xl bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        IMAP import
      </button>

      {(message || error) && (
        <span className={error ? "text-sm font-medium text-red-600" : "text-sm font-medium text-emerald-600"}>
          {error || message}
        </span>
      )}
    </div>
  );
}
