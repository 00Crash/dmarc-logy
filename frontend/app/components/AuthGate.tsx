"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

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
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <ShieldCheck size={28} />
            </div>
            <Badge variant="secondary">DMARC analyzátor</Badge>
            <CardTitle className="text-3xl">DMARC Logy</CardTitle>
            <CardDescription>Ověřuji přihlášení…</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (state === "login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] p-6">
        <Card className="w-full max-w-md overflow-hidden">
          <CardHeader className="items-center border-b border-slate-100 text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <LockKeyhole size={28} />
            </div>
            <Badge variant="secondary">DMARC analyzátor</Badge>
            <CardTitle className="text-3xl">DMARC Logy</CardTitle>
            <CardDescription>Přístup k aplikaci je chráněný přihlašovacími údaji.</CardDescription>
          </CardHeader>

          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={submit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Uživatel</span>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Heslo</span>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
              </label>

              {error && <Badge variant="destructive" className="w-full justify-center py-2">{error}</Badge>}

              <Button className="w-full" disabled={loading || !username || !password}>
                {loading && <Loader2 size={17} className="animate-spin" />}
                {loading ? "Přihlašuji…" : "Přihlásit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
