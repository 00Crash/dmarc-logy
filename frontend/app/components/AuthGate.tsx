"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";

type AuthState = "checking" | "authenticated" | "login";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      setState(res.ok ? "authenticated" : "login");
    } catch {
      setState("login");
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Přihlášení se nezdařilo");
      }
      setState("authenticated");
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  if (state === "checking") {
    return (
      <main className="login-shell">
        <section className="login-card">
          <span className="badge">DMARC analyzátor</span>
          <h1>DMARC Logy</h1>
          <p>Ověřuji přihlášení…</p>
        </section>
      </main>
    );
  }

  if (state === "login") {
    return (
      <main className="login-shell">
        <form className="login-card" onSubmit={submit}>
          <span className="badge">DMARC analyzátor</span>
          <h1>DMARC Logy</h1>
          <p>Přístup k aplikaci je chráněný přihlašovacími údaji z .env.</p>

          <label className="login-field">
            <span>Uživatel</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>

          <label className="login-field">
            <span>Heslo</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
          </label>

          {error && <div className="notice error">{error}</div>}
          <button className="button" disabled={loading || !username || !password}>
            {loading ? "Přihlašuji…" : "Přihlásit"}
          </button>
        </form>
      </main>
    );
  }

  return <>{children}</>;
}
