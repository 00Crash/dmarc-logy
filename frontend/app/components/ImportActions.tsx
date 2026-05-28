"use client";

import { FileUp, Inbox, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type Props = {
  onDone: () => Promise<void>;
};

export default function ImportActions({ onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function selectFile(nextFile: File | null | undefined) {
    if (!nextFile) return;
    setFile(nextFile);
    setMessage("");
    setError("");
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
      setMessage(data.message || "Hotovo");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      setMessage(`IMAP: ${data.processed_attachments || 0}`);
      await onDone();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="h-full overflow-hidden shadow-none">
      <CardContent className="flex h-full min-w-0 items-center gap-2 p-2.5">
        <div className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-950">
          <UploadCloud size={16} className="text-blue-600" />
          Import
        </div>

        <label className="group flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-950 transition hover:border-blue-300 hover:bg-blue-50">
          <input ref={fileInputRef} className="sr-only" type="file" accept=".xml,.zip,.gz" onChange={(event) => selectFile(event.target.files?.[0])} />
          <FileUp size={15} className="shrink-0 text-blue-600" />
          <span className="min-w-0 flex-1 truncate text-left">{file ? file.name : "Vybrat XML / ZIP / GZ"}</span>
          <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 2xl:inline">soubor</span>
        </label>

        {(message || error) && (
          <Badge variant={error ? "destructive" : "success"} className="max-w-24 shrink-0 truncate">
            {message || error}
          </Badge>
        )}

        <Button size="sm" className="h-10 shrink-0 px-3" onClick={upload} disabled={!file || loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          Nahrát
        </Button>
        <Button size="sm" className="h-10 shrink-0 px-3" variant="secondary" onClick={runImap} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Inbox size={14} />}
          IMAP
        </Button>
      </CardContent>
    </Card>
  );
}
