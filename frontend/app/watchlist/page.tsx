"use client";

import { Eye, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { SourceRow, domains, formatNumber, resultLabel } from "../lib";

function WatchlistContent() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const s = await fetch("/api/sources", { credentials: "include" }).then((res) => res.json());
    setSources(s);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
    const saved = window.localStorage.getItem("dmarc_watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  function save(items: string[]) {
    setWatchlist(items);
    window.localStorage.setItem("dmarc_watchlist", JSON.stringify(items));
  }

  function add(key: string) {
    if (!watchlist.includes(key)) save([...watchlist, key]);
  }

  function remove(key: string) {
    save(watchlist.filter((item) => item !== key));
  }

  const watchedSources = useMemo(() => sources.filter((source) => watchlist.includes(source.source_key)), [sources, watchlist]);
  const candidates = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sources
      .filter((source) => !watchlist.includes(source.source_key))
      .filter((source) => !term || source.source_ip.toLowerCase().includes(term) || source.header_from?.toLowerCase().includes(term))
      .slice(0, 12);
  }, [sources, watchlist, query]);

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Monitoring</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Watchlist</h1>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm">
              {watchlist.length} sledovaných zdrojů
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Eye size={21} /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Sledované zdroje</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Důležité IP adresy a domény</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-4">Zdroj</th><th className="px-5 py-4">Doména</th><th className="px-5 py-4">Objem</th><th className="px-5 py-4">DMARC</th><th className="px-5 py-4">SPF</th><th className="px-5 py-4">DKIM</th><th className="px-5 py-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {watchedSources.length === 0 ? (
                    <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Watchlist je prázdný.</td></tr>
                  ) : watchedSources.map((source) => (
                    <tr key={source.source_key} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-bold text-blue-600">{source.source_ip}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{source.header_from || domains(source.header_from_domains)}</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{formatNumber(source.total_count)}</td>
                      <td className="px-5 py-4">{resultLabel(source.dmarc)}</td>
                      <td className="px-5 py-4">{resultLabel(source.spf)}</td>
                      <td className="px-5 py-4">{resultLabel(source.dkim)}</td>
                      <td className="px-5 py-4 text-right"><button onClick={() => remove(source.source_key)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /> Odebrat</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><ShieldAlert size={21} /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Přidat zdroj</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Vyberte ze zpracovaných reportů</p>
              </div>
            </div>

            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat IP nebo doménu" className="mb-4 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />

            <div className="grid gap-3 lg:grid-cols-2">
              {candidates.map((source) => (
                <button key={source.source_key} onClick={() => add(source.source_key)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50">
                  <span>
                    <span className="block font-bold text-slate-950">{source.source_ip}</span>
                    <span className="mt-1 block text-sm font-medium text-slate-500">{source.header_from || domains(source.header_from_domains)}</span>
                  </span>
                  <Plus size={18} className="text-blue-600" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
      <AppVersionFooter />
    </main>
  );
}

export default function WatchlistPage() {
  return (
    <AuthGate>
      <WatchlistContent />
    </AuthGate>
  );
}
