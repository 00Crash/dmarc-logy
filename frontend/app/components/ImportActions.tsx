"use client";

import { Inbox, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

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
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud size={18} className="text-blue-600" />
              Import reportů
            </CardTitle>
            <CardDescription className="mt-2">Ruční upload XML/ZIP/GZ nebo okamžité načtení z IMAP mailboxu.</CardDescription>
          </div>
          <Badge variant="outline">DMARC</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Soubor</span>
          <Input type="file" accept=".xml,.zip,.gz" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>

        {file && <Badge variant="secondary" className="max-w-full truncate">{file.name}</Badge>}

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
          <div className="pt-1">
            <Badge variant={error ? "destructive" : "success"}>{message || error}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
