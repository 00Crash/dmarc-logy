"use client";

import { AlertTriangle, Globe2, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { SourceRow, domains, formatNumber, percent, resultLabel } from "../lib";

function scoreFor(items: SourceRow[]) {
  const total = items.reduce((sum, item) => sum + item.total_count, 0);
  const dmarcPass = items.reduce((sum, item) => sum + item.dmarc_pass_count, 0);
  const dmarcScore = total ? percent(dmarcPass, total) : 0;
  const unknownPenalty = items.filter((item) => item.classification === "unknown" || item.classification === "suspicious").length * 8;
  return Math.max(0, Math.min(100, Math.round(dmarcScore - unknownPenalty)));
}

function ScoreRing({ value }: { value: number }) {
  const color = value >= 85 ? "#16a34a" : value >= 60 ? "#2563eb" : "#dc2626";
  return (
    <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} ${value}%, #e2e8f0 0)` }}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function DetailContent() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const s = await fetch("/api/sources", { credentials: "include" }).then((res) => res.json());
    setSources(s);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
  }, []);

  const domainsList = useMemo(() => {
    const values = new Set<string>();
    sources.forEach((source) => source.header_from_domains?.forEach((domain) => domain && values.add(domain)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "cs"));
  }, [sources]);

  useEffect(() => {
    if (!selectedDomain && domainsList.length > 0) setSelectedDomain(domainsList[0]);
  }, [domainsList, selectedDomain]);

  const domainSources = useMemo(() => sources.filter((source) => source.header_from_domains?.includes(selectedDomain)), [sources, selectedDomain]);
  const total = domainSources.reduce((sum, item) => sum + item.total_count, 0);
  const dmarcPass = domainSources.reduce((sum, item) => sum + item.dmarc_pass_count, 0);
  const spfPass = domainSources.reduce((sum, item) => sum + item.spf_policy_pass_count, 0);
  const spfTotal = domainSources.reduce((sum, item) => sum + item.spf_policy_pass_count + item.spf_policy_fail_count, 0);
  const dkimPass = domainSources.reduce((sum, item) => sum + item.dkim_policy_pass_count, 0);
  const dkimTotal = domainSources.reduce((sum, item) => sum + item.dkim_policy_pass_count + item.dkim_policy_fail_count, 0);
  const riskScore = scoreFor(domainSources);

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Doména</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Detail</h1>
            </div>
            <label className="relative block w-full max-w-md">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                {domainsList.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
              </select>
            </label>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck size={21} /></div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Risk score</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{selectedDomain || "Bez domény"}</p>
                </div>
              </div>
              <div className="flex justify-center"><ScoreRing value={riskScore} /></div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Zprávy", value: formatNumber(total), icon: Globe2 },
                { label: "DMARC", value: `${percent(dmarcPass, total)} %`, icon: ShieldCheck },
                { label: "SPF", value: `${percent(spfPass, spfTotal)} %`, icon: TrendingUp },
                { label: "DKIM", value: `${percent(dkimPass, dkimTotal)} %`, icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={19} /></div>
                  <div className="text-sm font-semibold text-slate-500">{label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
                </div>
              ))}
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Zdroje domény</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-4">IP</th><th className="px-5 py-4">Provider</th><th className="px-5 py-4">Objem</th><th className="px-5 py-4">DMARC</th><th className="px-5 py-4">SPF domény</th><th className="px-5 py-4">DKIM domény</th><th className="px-5 py-4">Stav</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {domainSources.length === 0 ? (
                    <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Žádná data.</td></tr>
                  ) : domainSources.map((source) => (
                    <tr key={source.source_key} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-bold text-blue-600">{source.source_ip}</td>
                      <td className="px-5 py-4 text-slate-600">{source.provider_name || "Neznámý"}</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{formatNumber(source.total_count)}</td>
                      <td className="px-5 py-4">{resultLabel(source.dmarc)}</td>
                      <td className="px-5 py-4">{domains(source.spf_domains)}</td>
                      <td className="px-5 py-4">{domains(source.dkim_domains)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{source.classification}</td>
                    </tr>
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

export default function DetailPage() {
  return (
    <AuthGate>
      <DetailContent />
    </AuthGate>
  );
}
