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
        body: JSON.stringify({ username, password }),
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

  if (state === "authenticated") {
    return <>{children}</>;
  }

  return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fc] px-6 py-10 text-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.08),transparent_32%)]" />

        <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-blue-950/10 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden min-h-[620px] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-500 p-10 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.22),transparent_30%)]" />

            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/20" />
            <div className="absolute right-16 top-20 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute left-10 bottom-10 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute left-20 top-1/2 h-px w-40 bg-white/15" />
            <div className="absolute bottom-24 right-0 h-px w-48 bg-white/15" />
            <div className="absolute bottom-24 right-24 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative flex h-full items-center">
              <div>

                <h1 className="mt-5 text-6xl font-semibold leading-[0.95] tracking-tight text-white">
                  DMARC
                  <br />
                  Logy
                </h1>

                <div className="mt-8 h-px w-28 bg-white/35" />
              </div>
            </div>
          </aside>

          <div className="flex min-h-[620px] items-center justify-center p-7 sm:p-10">
            <div className="w-full max-w-sm">
              <div className="mb-8 lg:hidden">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
                  DMARC LOGY
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {state === "checking" ? "Ověřuji" : "Přihlášení"}
                </h2>
              </div>

              {state === "checking" ? (
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                      <p className="text-sm font-medium text-slate-700">
                        Ověřuji přihlášení…
                      </p>
                    </div>
                  </div>
              ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Uživatel
                  </span>
                      <input
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          autoComplete="username"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Heslo
                  </span>
                      <input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="current-password"
                          autoFocus
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </label>

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                          {error}
                        </div>
                    )}

                    <button
                        disabled={loading || !username || !password}
                        className="flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-700/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {loading ? (
                          <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Přihlašuji…
                    </span>
                      ) : (
                          "Přihlásit"
                      )}
                    </button>
                  </form>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}