"use client";

import { ChevronDown, Filter, Globe2, RotateCcw, Server } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { SourceRow, classLabel, domains, formatNumber, resultLabel, resultPill } from "../lib";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type Props = {
  sources: SourceRow[];
  loading?: boolean;
  onClassificationChange: (sourceId: number | null, sourceIp: string, classification: string) => Promise<void>;
};

const CLASSIFICATION_OPTIONS = [
  { value: "known", label: "známý" },
  { value: "unknown", label: "neznámý" },
  { value: "suspicious", label: "podezřelý" },
  { value: "ignored", label: "ignorovaný" },
  { value: "needs_fix", label: "vyžaduje opravu" }
];

export default function SourcesTable({ sources, loading = false, onClassificationChange }: Props) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [headerFromFilter, setHeaderFromFilter] = useState("all");
  const DEFAULT_CLASSIFICATION_FILTER = "all";
  const [classificationFilter, setClassificationFilter] = useState(DEFAULT_CLASSIFICATION_FILTER);

  const headerFromOptions = useMemo(() => {
    const values = new Set<string>();
    for (const source of sources) {
      for (const domain of source.header_from_domains || []) {
        const normalized = domain.trim();
        if (normalized) values.add(normalized);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "cs"));
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const matchesHeaderFrom = headerFromFilter === "all" || (source.header_from_domains || []).includes(headerFromFilter);
      const matchesClassification = classificationFilter === "all" || source.classification === classificationFilter;
      return matchesHeaderFrom && matchesClassification;
    });
  }, [sources, headerFromFilter, classificationFilter]);

  const activeFilters = headerFromFilter !== "all" || classificationFilter !== DEFAULT_CLASSIFICATION_FILTER;

  function resetFilters() {
    setHeaderFromFilter("all");
    setClassificationFilter(DEFAULT_CLASSIFICATION_FILTER);
    setExpandedSource(null);
  }

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-col gap-4 border-b border-slate-100 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Server size={21} />
          </div>
          <div className="min-w-0">
            <CardTitle>Zdroje odesílání</CardTitle>
            <CardDescription>
              Řádek je kombinace IP adresy a Header From domény. Jedna IP se může zobrazit vícekrát, pokud posílá pro více domén.
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-400"><Filter size={13} />Header From</span>
            <select value={headerFromFilter} onChange={(event) => setHeaderFromFilter(event.target.value)} className="h-10 min-w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              <option value="all">všechny domény</option>
              {headerFromOptions.map((domain) => (
                <option value={domain} key={domain}>{domain}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Stav zdroje</span>
            <select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)} className="h-10 min-w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              <option value="all">všechny stavy</option>
              {CLASSIFICATION_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 items-center rounded-xl bg-blue-50 px-3 text-sm font-black text-blue-700" title={`Zobrazeno ${filteredSources.length} z ${sources.length} kombinací zdroj + doména`}>
              {filteredSources.length}/{sources.length}
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} disabled={!activeFilters}>
              <RotateCcw size={15} /> Zrušit
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <table className="w-full min-w-[1380px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
            <tr>
              {["Zdroj", "Header From", "Provider", "Objem", "DMARC", "SPF", "DKIM", "SPF domény", "DKIM domény", "Stav zdroje"].map((head) => (
                <th key={head} className="border-b border-slate-200 px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={10}>Zatím nejsou data.</td></tr>
            ) : filteredSources.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={10}>Žádný zdroj neodpovídá vybraným filtrům.</td></tr>
            ) : filteredSources.map((source) => (
              <Fragment key={source.source_key}>
                <tr className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3 align-top">
                    <button className="inline-flex max-w-[240px] items-center gap-2 text-left font-black text-blue-600 hover:text-blue-700" onClick={() => setExpandedSource(expandedSource === source.source_key ? null : source.source_key)}>
                      <ChevronDown size={15} className={expandedSource === source.source_key ? "rotate-180 transition" : "transition"} />
                      <span className="break-all">{source.source_ip}</span>
                    </button>
                    <small className="mt-1 block max-w-[240px] break-words text-xs font-medium text-slate-400">{source.reverse_dns || "bez reverse DNS"}</small>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex max-w-[170px] items-start gap-2 font-bold text-slate-700" title={source.header_from}>
                      <Globe2 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="truncate">{source.header_from || domains(source.header_from_domains)}</span>
                    </div>
                  </td>
                  <td className="max-w-[260px] break-words px-4 py-3 align-top font-medium text-slate-600" title={source.provider_name || "Neznámý"}>{source.provider_name || "Neznámý"}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-black text-slate-950">{formatNumber(source.total_count)}</td>
                  <td className="px-4 py-3 align-top"><span className={resultPill(source.dmarc)}>{resultLabel(source.dmarc)}</span><br /><small className="text-xs font-medium text-slate-400">{source.dmarc_pass_rate} %</small></td>
                  <td className="px-4 py-3 align-top"><span className={resultPill(source.spf)}>{resultLabel(source.spf)}</span><br /><small className="text-xs font-medium text-slate-400">{formatNumber(source.spf_policy_pass_count)} / {formatNumber(source.spf_policy_fail_count)}</small></td>
                  <td className="px-4 py-3 align-top"><span className={resultPill(source.dkim)}>{resultLabel(source.dkim)}</span><br /><small className="text-xs font-medium text-slate-400">{formatNumber(source.dkim_policy_pass_count)} / {formatNumber(source.dkim_policy_fail_count)}</small></td>
                  <td className="px-4 py-3 align-top"><div className="max-w-[180px] truncate font-medium text-slate-600" title={source.spf_domains?.join(", ")}>{domains(source.spf_domains)}</div></td>
                  <td className="px-4 py-3 align-top"><div className="max-w-[180px] truncate font-medium text-slate-600" title={source.dkim_domains?.join(", ")}>{domains(source.dkim_domains)}</div></td>
                  <td className="px-4 py-3 align-top">
                    <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} aria-label={`Stav zdroje ${source.source_ip} ${source.header_from || ""}`} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60">
                      {CLASSIFICATION_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs font-medium text-slate-400">{classLabel(source.classification)}</div>
                  </td>
                </tr>
                {expandedSource === source.source_key && (
                  <tr className="bg-blue-50/40">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="grid gap-3 text-sm font-medium text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <span><strong className="text-slate-950">DMARC:</strong> {formatNumber(source.dmarc_pass_count)} pass / {formatNumber(source.dmarc_fail_count)} fail</span>
                        <span><strong className="text-slate-950">SPF policy:</strong> {formatNumber(source.spf_policy_pass_count)} pass / {formatNumber(source.spf_policy_fail_count)} fail</span>
                        <span><strong className="text-slate-950">DKIM policy:</strong> {formatNumber(source.dkim_policy_pass_count)} pass / {formatNumber(source.dkim_policy_fail_count)} fail</span>
                        <span><strong className="text-slate-950">SPF auth:</strong> {formatNumber(source.spf_auth_pass_count)} pass / {formatNumber(source.spf_auth_fail_count)} fail</span>
                        <span><strong className="text-slate-950">DKIM auth:</strong> {formatNumber(source.dkim_auth_pass_count)} pass / {formatNumber(source.dkim_auth_fail_count)} fail</span>
                        <span><strong className="text-slate-950">Disposition:</strong> none {formatNumber(source.disposition_none_count)}, quarantine {formatNumber(source.disposition_quarantine_count)}, reject {formatNumber(source.disposition_reject_count)}</span>
                        <span className="xl:col-span-2"><strong className="text-slate-950">Envelope From:</strong> {domains(source.envelope_from_domains)}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
      <div className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-400">Stav zdroje se teď ukládá pro konkrétní kombinaci domény a IP adresy. Stejná IP tedy může být pro jednu doménu známá a pro druhou podezřelá.</div>
    </Card>
  );
}
