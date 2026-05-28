"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

type AuthState = "checking" | "authenticated" | "login";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");
  const [username, setUsername] = useState("");
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
        throw new Error(data.detail || "Login failed");
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
      <main className="flex min-h-screen items-center justify-center bg-white p-6">
        <Card className="w-full max-w-sm border-slate-200 shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">Login</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (state === "login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6">
        <Card className="w-full max-w-sm border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold tracking-tight">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
              {error && <Badge variant="destructive" className="w-full justify-center py-2">{error}</Badge>}
              <Button className="w-full" disabled={loading || !username || !password}>
                {loading && <Loader2 size={17} className="animate-spin" />}
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
