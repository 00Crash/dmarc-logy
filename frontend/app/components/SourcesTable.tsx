"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw, Server } from "lucide-react";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const totalPages = Math.max(1, Math.ceil(filteredSources.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedSources = filteredSources.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeFilters = headerFromFilter !== "all" || classificationFilter !== "all";

  function resetFilters() {
    setHeaderFromFilter("all");
    setClassificationFilter("all");
    setExpandedSource(null);
    setPage(1);
  }

  function setDomain(value: string) {
    setHeaderFromFilter(value);
    setPage(1);
    setExpandedSource(null);
  }

  function setState(value: string) {
    setClassificationFilter(value);
    setPage(1);
    setExpandedSource(null);
  }

  function changePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
    setExpandedSource(null);
  }

  return (
    <Card className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-none">
      <div className="border-b border-slate-100 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Server size={16} className="text-blue-600" />
            Zdroje
          </CardTitle>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={12} />
              <select value={headerFromFilter} onChange={(event) => setDomain(event.target.value)} className="h-8 max-w-44 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400">
                <option value="all">všechny domény</option>
                {headerFromOptions.map((domain) => <option value={domain} key={domain}>{domain}</option>)}
              </select>
            </label>

            <select value={classificationFilter} onChange={(event) => setState(event.target.value)} className="h-8 max-w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400">
              <option value="all">všechny stavy</option>
              {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>

            <Badge variant="secondary">{filteredSources.length}/{sources.length}</Badge>
            <Button variant="outline" size="sm" className="h-8" onClick={resetFilters} disabled={!activeFilters}>
              <RotateCcw size={13} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="min-h-0 p-0">
        <TableWrapper className="h-full overflow-auto">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                {["Zdroj", "Header From", "Provider", "Objem", "DMARC", "SPF", "DKIM", "SPF domény", "DKIM domény", "Stav"].map((head) => (
                  <TableHead className="py-2" key={head}>{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length === 0 ? (
                <TableRow><TableCell className="py-10 text-center text-slate-500" colSpan={10}>Zatím nejsou data.</TableCell></TableRow>
              ) : pagedSources.length === 0 ? (
                <TableRow><TableCell className="py-10 text-center text-slate-500" colSpan={10}>Žádný zdroj neodpovídá filtrům.</TableCell></TableRow>
              ) : pagedSources.map((source) => (
                <Fragment key={source.source_key}>
                  <TableRow>
                    <TableCell className="py-2">
                      <button className="inline-flex max-w-[220px] items-center gap-2 text-left text-sm font-medium text-slate-950" onClick={() => setExpandedSource(expandedSource === source.source_key ? null : source.source_key)}>
                        <ChevronDown size={14} className={expandedSource === source.source_key ? "rotate-180 transition" : "transition"} />
                        <span className="break-all">{source.source_ip}</span>
                      </button>
                      <small className="mt-0.5 block max-w-[220px] truncate text-[11px] text-slate-400">{source.reverse_dns || "bez reverse DNS"}</small>
                    </TableCell>
                    <TableCell className="max-w-[170px] truncate py-2 text-sm font-medium text-slate-700" title={source.header_from}>{source.header_from || domains(source.header_from_domains)}</TableCell>
                    <TableCell className="max-w-[230px] truncate py-2 text-sm text-slate-500" title={source.provider_name || "Neznámý"}>{source.provider_name || "Neznámý"}</TableCell>
                    <TableCell className="py-2 text-sm font-semibold text-slate-950">{formatNumber(source.total_count)}</TableCell>
                    <TableCell className="py-2"><span className={resultPill(source.dmarc)}>{resultLabel(source.dmarc)}</span><div className="mt-0.5 text-[11px] text-slate-400">{source.dmarc_pass_rate} %</div></TableCell>
                    <TableCell className="py-2"><span className={resultPill(source.spf)}>{resultLabel(source.spf)}</span><div className="mt-0.5 text-[11px] text-slate-400">{formatNumber(source.spf_policy_pass_count)} / {formatNumber(source.spf_policy_fail_count)}</div></TableCell>
                    <TableCell className="py-2"><span className={resultPill(source.dkim)}>{resultLabel(source.dkim)}</span><div className="mt-0.5 text-[11px] text-slate-400">{formatNumber(source.dkim_policy_pass_count)} / {formatNumber(source.dkim_policy_fail_count)}</div></TableCell>
                    <TableCell className="max-w-[170px] truncate py-2 text-sm text-slate-500" title={source.spf_domains?.join(", ")}>{domains(source.spf_domains)}</TableCell>
                    <TableCell className="max-w-[170px] truncate py-2 text-sm text-slate-500" title={source.dkim_domains?.join(", ")}>{domains(source.dkim_domains)}</TableCell>
                    <TableCell className="py-2">
                      <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60">
                        {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                    </TableCell>
                  </TableRow>
                  {expandedSource === source.source_key && (
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                      <TableCell colSpan={10} className="px-4 py-3">
                        <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>Strana {safePage} / {totalPages}</span>
          <label className="flex items-center gap-1.5">
            <span>Řádků</span>
            <select value={pageSize} onChange={(event) => changePageSize(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400">
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="outline" size="sm" className="h-8" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
