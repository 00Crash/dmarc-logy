"use client";

import { Inbox, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Import reportů</CardTitle>
          <CardDescription>Ruční upload XML/ZIP/GZ nebo okamžité načtení z IMAP mailboxu.</CardDescription>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UploadCloud size={22} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50">
          <span className="truncate text-sm font-bold text-slate-700">{file ? file.name : "Vybrat XML / ZIP / GZ soubor"}</span>
          <input className="hidden" type="file" accept=".xml,.zip,.gz" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button onClick={upload} disabled={!file || loading}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
            Nahrát report
          </Button>
          <Button variant="secondary" onClick={runImap} disabled={loading}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Inbox size={17} />}
            Spustit IMAP import
          </Button>
        </div>

        {(message || error) && (
          <div className={error ? "rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" : "rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"}>
            {message || error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
