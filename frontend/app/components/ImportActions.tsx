"use client";

import { Inbox, Loader2, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { Badge } from "./ui/badge";
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
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <UploadCloud size={18} className="text-blue-600" />
              Import reportů
            </CardTitle>
            <CardDescription className="mt-2">XML, ZIP nebo GZ report z mailboxu.</CardDescription>
          </div>
          <Badge variant="outline">DMARC</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            "group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition",
            dragActive ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/50",
          ].join(" ")}
        >
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".xml,.zip,.gz"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <UploadCloud size={28} className="mb-3 text-blue-600 transition group-hover:-translate-y-0.5" />
          <span className="text-sm font-semibold text-slate-950">Klikněte pro výběr souboru</span>
          <span className="mt-1 text-sm text-slate-500">nebo ho sem přetáhněte</span>
          <span className="mt-3 text-xs font-medium text-slate-400">XML · ZIP · GZ</span>
        </label>

        {file && <Badge variant="secondary" className="max-w-full truncate">{file.name}</Badge>}

        <div className="grid gap-2">
          <Button onClick={upload} disabled={!file || loading}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
            Nahrát report
          </Button>
          <Button variant="secondary" onClick={runImap} disabled={loading}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Inbox size={17} />}
            Spustit IMAP import
          </Button>
        </div>

        {(message || error) && <Badge variant={error ? "destructive" : "success"}>{message || error}</Badge>}
      </CardContent>
    </Card>
  );
}
