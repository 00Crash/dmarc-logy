"use client";

import { ChevronDown, Filter, RotateCcw, Server } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { SourceRow, classLabel, domains, formatNumber, resultLabel, resultPill } from "../lib";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "./ui/table";

type Props = {
  sources: SourceRow[];
  loading?: boolean;
  onClassificationChange: (sourceId: number | null, sourceIp: string, classification: string) => Promise<void>;
};

const CLASSIFICATION_OPTIONS = [
  { value: "known", label: "známý" },
  { value: "unknown", label: "neznámý" },
  { value: "suspicious", label: "podezdřelý" },
  { value: "ignored", label: "ignorován" },
  { value: "needs_fix", label: "vyžaduje opravu" }
];

export default function SourcesTable({ sources, loading = false, onClassificationChange }: Props) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [headerFromFilter, setHeaderFromFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("unknown");

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

  const activeFilters = headerFromFilter !== "all" || classificationFilter !== "all";

  function resetFilters() {
    setHeaderFromFilter("all");
    setClassificationFilter("unknown");
    setExpandedSource(null);
  }

  function setDomain(value: string) {
    setHeaderFromFilter(value);
    setExpandedSource(null);
  }

  function setState(value: string) {
    setClassificationFilter(value);
    setExpandedSource(null);
  }

  return (
    <Card className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden shadow-none">
      <div className="border-b border-slate-100 px-4 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <Server size={14} className="text-blue-600" />
            Zdroje
          </CardTitle>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={11} />
              <select value={headerFromFilter} onChange={(event) => setDomain(event.target.value)} className="h-7 max-w-44 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400">
                <option value="all">v\u0161echny dom\u00e9ny</option>
                {headerFromOptions.map((domain) => <option value={domain} key={domain}>{domain}</option>)}
              </select>
            </label>

            <select value={classificationFilter} onChange={(event) => setState(event.target.value)} className="h-7 max-w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400">
              <option value="all">v\u0161echny stavy</option>
              {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>

            <Badge variant="secondary" className="text-[11px]">{filteredSources.length}/{sources.length}</Badge>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={resetFilters} disabled={!activeFilters}>
              <RotateCcw size={12} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="min-h-0 p-0">
        <TableWrapper className="h-full overflow-auto">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                {["Zdroj", "Header From", "Provider", "Objem", "DMARC", "SPF", "DKIM", "SPF dom\u00e9ny", "DKIM dom\u00e9ny", "Stav"].map((head) => (
                  <TableHead className="py-1 text-[11px]" key={head}>{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-xs text-slate-500" colSpan={10}>Zat\u00edm nejsou data.</TableCell></TableRow>
              ) : filteredSources.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-xs text-slate-500" colSpan={10}>\u017d\u00e1dn\u00fd zdroj neodpov\u00edd\u00e1 filtr\u016fm.</TableCell></TableRow>
              ) : filteredSources.map((source) => (
                <Fragment key={source.source_key}>
                  <TableRow className="h-[33px]">
                    <TableCell className="py-1">
                      <button className="inline-flex max-w-[220px] items-center gap-1.5 text-left text-xs font-medium text-slate-950" onClick={() => setExpandedSource(expandedSource === source.source_key ? null : source.source_key)}>
                        <ChevronDown size={12} className={expandedSource === source.source_key ? "rotate-180 transition" : "transition"} />
                        <span className="break-all">{source.source_ip}</span>
                      </button>
                      <small className="mt-0 block max-w-[220px] truncate text-[10px] text-slate-400">{source.reverse_dns || "bez reverse DNS"}</small>
                    </TableCell>
                    <TableCell className="max-w-[170px] truncate py-1 text-xs font-medium text-slate-700" title={source.header_from}>{source.header_from || domains(source.header_from_domains)}</TableCell>
                    <TableCell className="max-w-[230px] truncate py-1 text-xs text-slate-500" title={source.provider_name || "Nezn\u00e1m\u00fd"}>{source.provider_name || "Nezn\u00e1m\u00fd"}</TableCell>
                    <TableCell className="py-1 text-xs font-semibold text-slate-950">{formatNumber(source.total_count)}</TableCell>
                    <TableCell className="py-1"><span className={resultPill(source.dmarc)}>{resultLabel(source.dmarc)}</span><div className="mt-0 text-[10px] text-slate-400">{source.dmarc_pass_rate} %</div></TableCell>
                    <TableCell className="py-1"><span className={resultPill(source.spf)}>{resultLabel(source.spf)}</span><div className="mt-0 text-[10px] text-slate-400">{formatNumber(source.spf_policy_pass_count)} / {formatNumber(source.spf_policy_fail_count)}</div></TableCell>
                    <TableCell className="py-1"><span className={resultPill(source.dkim)}>{resultLabel(source.dkim)}</span><div className="mt-0 text-[10px] text-slate-400">{formatNumber(source.dkim_policy_pass_count)} / {formatNumber(source.dkim_policy_fail_count)}</div></TableCell>
                    <TableCell className="max-w-[170px] truncate py-1 text-xs text-slate-500" title={source.spf_domains?.join(", ")}>{domains(source.spf_domains)}</TableCell>
                    <TableCell className="max-w-[170px] truncate py-1 text-xs text-slate-500" title={source.dkim_domains?.join(", ")}>{domains(source.dkim_domains)}</TableCell>
                    <TableCell className="py-1">
                      <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60">
                        {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                    </TableCell>
                  </TableRow>
                  {expandedSource === source.source_key && (
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                      <TableCell colSpan={10} className="px-4 py-2">
                        <div className="grid gap-1.5 text-[11px] text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                          <span><strong className="text-slate-950">DMARC:</strong> {formatNumber(source.dmarc_pass_count)} pass / {formatNumber(source.dmarc_fail_count)} fail</span>
                          <span><strong className="text-slate-950">SPF policy:</strong> {formatNumber(source.spf_policy_pass_count)} pass / {formatNumber(source.spf_policy_fail_count)} fail</span>
                          <span><strong className="text-slate-950">DKIM policy:</strong> {formatNumber(source.dkim_policy_pass_count)} pass / {formatNumber(source.dkim_policy_fail_count)} fail</span>
                          <span><strong className="text-slate-950">SPF auth:</strong> {formatNumber(source.spf_auth_pass_count)} pass / {formatNumber(source.spf_auth_fail_count)} fail</span>
                          <span><strong className="text-slate-950">DKIM auth:</strong> {formatNumber(source.dkim_auth_pass_count)} pass / {formatNumber(source.dkim_auth_fail_count)} fail</span>
                          <span><strong className="text-slate-950">Disposition:</strong> none {formatNumber(source.disposition_none_count)}, quarantine {formatNumber(source.disposition_quarantine_count)}, reject {formatNumber(source.disposition_reject_count)}</span>
                          <span className="xl:col-span-2"><strong className="text-slate-950">Envelope From:</strong> {domains(source.envelope_from_domains)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </CardContent>
    </Card>
  );
}
