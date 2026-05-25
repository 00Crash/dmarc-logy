"use client";

import { ChevronLeft, ChevronRight, Globe2, RotateCcw, Server } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { SourceRow, domains, formatNumber, resultLabel } from "../lib";

type Props = {
  sources: SourceRow[];
  loading?: boolean;
  onClassificationChange: (sourceId: number | null, sourceIp: string, classification: string) => Promise<void>;
};

const PAGE_SIZE = 50;

const CLASSIFICATION_OPTIONS = [
  { value: "known", label: "známý" },
  { value: "unknown", label: "neznámý" },
  { value: "suspicious", label: "podezřelý" },
  { value: "ignored", label: "ignorovaný" },
  { value: "needs_fix", label: "oprava" },
];

function pill(value: string) {
  if (value === "pass") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value === "fail") return "bg-red-50 text-red-700 ring-red-200";
  if (value === "mixed") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export default function SourcesTable({ sources, loading = false, onClassificationChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("unknown");
  const [page, setPage] = useState(1);

  const domainOptions = useMemo(() => {
    const values = new Set<string>();
    sources.forEach((source) => source.header_from_domains?.forEach((domain) => domain && values.add(domain)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "cs"));
  }, [sources]);

  const filtered = useMemo(() => {
    return sources.filter((source) => {
      const domainOk = domainFilter === "all" || source.header_from_domains?.includes(domainFilter);
      const stateOk = stateFilter === "all" || source.classification === stateFilter;
      return domainOk && stateOk;
    });
  }, [sources, domainFilter, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function reset() {
    setDomainFilter("all");
    setStateFilter("unknown");
    setPage(1);
    setExpanded(null);
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Server size={21} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Zdroje</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{filtered.length} z {sources.length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={domainFilter} onChange={(event) => { setDomainFilter(event.target.value); setPage(1); }} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
            <option value="all">všechny domény</option>
            {domainOptions.map((domain) => <option value={domain} key={domain}>{domain}</option>)}
          </select>
          <select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
            <option value="all">všechny stavy</option>
            {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
          <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4">Zdroj</th>
              <th className="px-5 py-4">Doména</th>
              <th className="px-5 py-4">Provider</th>
              <th className="px-5 py-4">Objem</th>
              <th className="px-5 py-4">DMARC</th>
              <th className="px-5 py-4">SPF</th>
              <th className="px-5 py-4">DKIM</th>
              <th className="px-5 py-4">Stav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length === 0 ? (
              <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={8}>Žádná data.</td></tr>
            ) : paged.map((source) => (
              <Fragment key={source.source_key}>
                <tr className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 align-top">
                    <button className="font-bold text-blue-600 hover:text-blue-700" onClick={() => setExpanded(expanded === source.source_key ? null : source.source_key)}>{source.source_ip}</button>
                    <div className="mt-1 max-w-[190px] truncate text-xs font-medium text-slate-400">{source.reverse_dns || "bez RDNS"}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-2 font-semibold text-slate-700"><Globe2 size={15} className="text-slate-400" />{source.header_from || domains(source.header_from_domains)}</div>
                  </td>
                  <td className="px-5 py-4 align-top text-slate-600">{source.provider_name || "Neznámý"}</td>
                  <td className="px-5 py-4 align-top font-bold text-slate-950">{formatNumber(source.total_count)}</td>
                  <td className="px-5 py-4 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${pill(source.dmarc)}`}>{resultLabel(source.dmarc)}</span></td>
                  <td className="px-5 py-4 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${pill(source.spf)}`}>{resultLabel(source.spf)}</span></td>
                  <td className="px-5 py-4 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${pill(source.dkim)}`}>{resultLabel(source.dkim)}</span></td>
                  <td className="px-5 py-4 align-top">
                    <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60">
                      {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                </tr>
                {expanded === source.source_key && (
                  <tr className="bg-blue-50/40"><td colSpan={8} className="px-5 py-4 text-sm font-medium text-slate-600">SPF: <strong>{domains(source.spf_domains)}</strong> · DKIM: <strong>{domains(source.dkim_domains)}</strong></td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-slate-500">Strana {safePage} / {totalPages}</div>
        <div className="flex gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /> Zpět</button>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Další <ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}
