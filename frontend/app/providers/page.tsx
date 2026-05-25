"use client";

import { BadgeCheck, Building2, CheckCircle2, Search, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { SourceRow, formatNumber } from "../lib";

const PROVIDERS = [
  { name: "Microsoft 365", type: "Cloud mail", patterns: ["outlook", "protection.outlook", "office365", "microsoft"], spf: "include:spf.protection.outlook.com" },
  { name: "Google Workspace", type: "Cloud mail", patterns: ["google", "googlemail", "gmail"], spf: "include:_spf.google.com" },
  { name: "Amazon SES", type: "Transactional", patterns: ["amazonses", "amazonaws", "ses"], spf: "include:amazonses.com" },
  { name: "SendGrid", type: "Transactional", patterns: ["sendgrid", "sendgrid.net"], spf: "include:sendgrid.net" },
  { name: "Mailchimp", type: "Marketing", patterns: ["mailchimp", "mandrill", "mcdlv"], spf: "include:servers.mcsv.net" },
  { name: "Mailgun", type: "Transactional", patterns: ["mailgun"], spf: "include:mailgun.org" },
  { name: "Ecomail", type: "Marketing", patterns: ["ecomail"], spf: "include:spf.ecomailapp.cz" },
  { name: "SmartEmailing", type: "Marketing", patterns: ["smartemailing"], spf: "include:spf.smartemailing.cz" },
  { name: "Shoptet", type: "E-commerce", patterns: ["shoptet"], spf: "include:_spf.myshoptet.com" },
];

function detectProvider(source: SourceRow) {
  const haystack = [source.provider_name, source.reverse_dns, source.source_ip, source.header_from, ...(source.spf_domains || []), ...(source.dkim_domains || [])].filter(Boolean).join(" ").toLowerCase();
  return PROVIDERS.find((provider) => provider.patterns.some((pattern) => haystack.includes(pattern)));
}

function ProvidersContent() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const s = await fetch("/api/sources", { credentials: "include" }).then((res) => res.json());
    setSources(s);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
  }, []);

  const detected = useMemo(() => sources.map((source) => ({ source, provider: detectProvider(source) })).filter((item) => item.provider), [sources]);
  const filteredProviders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return PROVIDERS.filter((provider) => !term || provider.name.toLowerCase().includes(term) || provider.type.toLowerCase().includes(term));
  }, [query]);

  async function markKnown() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const targets = detected.filter(({ source }) => source.classification !== "known" && (source.dmarc === "pass" || source.spf === "pass" || source.dkim === "pass"));
      await Promise.all(targets.map(({ source }) => {
        const url = source.source_id ? `/api/sources/by-id/${source.source_id}` : `/api/sources/${encodeURIComponent(source.source_ip)}`;
        return fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classification: "known" }),
        });
      }));
      setMessage(`Označeno jako známé: ${targets.length}`);
      await loadData();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Intelligence</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Provider katalog</h1>
            </div>
            <button onClick={markKnown} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300">
              <Wand2 size={17} /> Označit rozpoznané
            </button>
          </div>

          {(error || message) && <div className={error ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"}>{error || message}</div>}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Rozpoznáno</div><div className="mt-2 text-4xl font-black text-slate-950">{formatNumber(detected.length)}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Katalog</div><div className="mt-2 text-4xl font-black text-slate-950">{PROVIDERS.length}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Celkem zdrojů</div><div className="mt-2 text-4xl font-black text-slate-950">{formatNumber(sources.length)}</div></div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="relative block">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat provider" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </label>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredProviders.map((provider) => {
              const count = detected.filter((item) => item.provider?.name === provider.name).length;
              return (
                <section key={provider.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 size={21} /></div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-950">{provider.name}</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">{provider.type}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{count}</span>
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">SPF</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-slate-700">{provider.spf}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.patterns.map((pattern) => <span key={pattern} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{pattern}</span>)}
                  </div>
                </section>
              );
            })}
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><BadgeCheck size={20} /></div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Rozpoznané zdroje</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Provider</th><th className="px-5 py-4">IP</th><th className="px-5 py-4">Doména</th><th className="px-5 py-4">Stav</th><th className="px-5 py-4">Výsledek</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {detected.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Nic nerozpoznáno.</td></tr> : detected.slice(0, 50).map(({ source, provider }) => (
                    <tr key={source.source_key} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-bold text-slate-950">{provider?.name}</td><td className="px-5 py-4 font-bold text-blue-600">{source.source_ip}</td><td className="px-5 py-4">{source.header_from}</td><td className="px-5 py-4">{source.classification}</td><td className="px-5 py-4"><CheckCircle2 size={17} className="text-emerald-600" /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
      <AppVersionFooter />
    </main>
  );
}

export default function ProvidersPage() {
  return <AuthGate><ProvidersContent /></AuthGate>;
}
