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
      <CardContent className="flex h-full min-w-0 flex-col justify-center gap-2 p-3">
        {/* Řádek 1: Label + IMAP tlačítko */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-950">
            <UploadCloud size={15} className="text-blue-600" />
            Import
          </div>
          <Button
            size="sm"
            className="ml-auto h-8 shrink-0 px-3"
            variant="secondary"
            onClick={runImap}
            disabled={loading}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Inbox size={13} />}
            IMAP
          </Button>
        </div>

        {/* Řádek 2: Výběr souboru */}
        <div className="flex items-center gap-2">
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
            className="h-8 min-w-0 flex-1 justify-start px-2.5"
            onClick={() => fileInputRef.current?.click()}
            title={file?.name || "Vybrat soubor (.xml/.zip/.gz)"}
          >
            <UploadCloud size={13} className="shrink-0 text-slate-400" />
            <span className="truncate text-xs">{file ? file.name : "Vybrat soubor…"}</span>
          </Button>
          {file && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0 text-slate-400 hover:text-slate-700"
              onClick={clearFile}
              title="Zrušit výběr"
            >
              <X size={13} />
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 shrink-0 px-3"
            onClick={file ? uploadSelectedFile : () => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            Nahrát
          </Button>
        </div>

        {/* Status badge */}
        {(message || error) && (
          <Badge
            variant={error ? "destructive" : "success"}
            className="w-full justify-center truncate text-center"
          >
            {message || error}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
