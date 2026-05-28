"use client";

import { Inbox, Loader2, UploadCloud, X } from "lucide-react";
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

  function clearFile() {
    setFile(null);
    setMessage("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadSelectedFile() {
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
      <CardContent className="flex h-full min-w-0 items-center gap-2 px-3 py-0">
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-950">
          <UploadCloud size={13} className="text-blue-600" />
          Import
        </div>

        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".xml,.zip,.gz"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 min-w-0 flex-1 justify-start px-2"
          onClick={() => fileInputRef.current?.click()}
          title={file?.name || "Vybrat soubor (.xml/.zip/.gz)"}
        >
          <UploadCloud size={12} className="shrink-0 text-slate-400" />
          <span className="truncate text-[11px]">{file ? file.name : "Vybrat soubor…"}</span>
        </Button>

        {file && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 shrink-0 p-0 text-slate-400 hover:text-slate-700"
            onClick={clearFile}
            title="Zrušit výběr"
          >
            <X size={12} />
          </Button>
        )}

        <Button
          size="sm"
          className="h-7 shrink-0 px-3"
          onClick={file ? uploadSelectedFile : () => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
          Nahrát
        </Button>

        <Button size="sm" className="h-7 shrink-0 px-3" variant="secondary" onClick={runImap} disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Inbox size={12} />}
          IMAP
        </Button>

        {(message || error) && (
          <Badge variant={error ? "destructive" : "success"} className="shrink-0 max-w-[120px] truncate text-[10px]">
            {message || error}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
