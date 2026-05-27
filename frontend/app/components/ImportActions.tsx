"use client";

import { Inbox, Loader2, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function selectFile(nextFile: File | null | undefined) {
    if (!nextFile) return;
    setFile(nextFile);
    setMessage("");
    setError("");
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    selectFile(event.dataTransfer.files?.[0]);
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
      setMessage(data.message || "Report byl zpracován");
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
      setMessage(`IMAP import: ${data.status}, přílohy: ${data.processed_attachments || 0}`);
      await onDone();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="h-full shadow-none">
      <CardContent className="grid h-full grid-rows-[auto_1fr_auto] gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <UploadCloud size={16} className="text-blue-600" />
            Import
          </div>
          <Badge variant="outline">DMARC</Badge>
        </div>

        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            "group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-3 py-2 text-center transition",
            dragActive ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/50",
          ].join(" ")}
        >
          <input ref={fileInputRef} className="sr-only" type="file" accept=".xml,.zip,.gz" onChange={(event) => selectFile(event.target.files?.[0])} />
          <UploadCloud size={22} className="mb-1 text-blue-600 transition group-hover:-translate-y-0.5" />
          <span className="text-xs font-semibold text-slate-950">Kliknout nebo přetáhnout</span>
          <span className="mt-0.5 text-[11px] text-slate-400">XML · ZIP · GZ</span>
        </label>

        <div className="grid gap-2">
          {file && <Badge variant="secondary" className="max-w-full truncate">{file.name}</Badge>}
          {(message || error) && <Badge variant={error ? "destructive" : "success"}>{message || error}</Badge>}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={upload} disabled={!file || loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              Nahrát
            </Button>
            <Button size="sm" variant="secondary" onClick={runImap} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Inbox size={15} />}
              IMAP
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
