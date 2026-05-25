"use client";

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
    <section className="card import-card">
      <div>
        <h2>Import reportů</h2>
        <p>Ruční upload XML/ZIP/GZ nebo okamžité načtení z IMAP mailboxu.</p>
      </div>
      <div className="import-actions">
        <label className="file-picker">
          <input type="file" accept=".xml,.zip,.gz" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <button className="button" onClick={upload} disabled={!file || loading}>Nahrát report</button>
        <button className="button secondary" onClick={runImap} disabled={loading}>Spustit IMAP import</button>
      </div>
      {(message || error) && (
        <div className="message-row inline-message">
          {message && <div className="notice ok">{message}</div>}
          {error && <div className="notice error">{error}</div>}
        </div>
      )}
    </section>
  );
}
