"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw, Server } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { SourceRow, classLabel, domains, formatNumber, resultLabel, resultPill } from "../lib";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Server size={18} className="text-blue-600" />
              Zdroje odesílání
            </CardTitle>
            <CardDescription className="mt-2">Kombinace zdrojové IP adresy a Header From domény.</CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"><Filter size={13} />Doména</span>
              <select value={headerFromFilter} onChange={(event) => setDomain(event.target.value)} className="h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400">
                <option value="all">všechny domény</option>
                {headerFromOptions.map((domain) => <option value={domain} key={domain}>{domain}</option>)}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stav</span>
              <select value={classificationFilter} onChange={(event) => setState(event.target.value)} className="h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400">
                <option value="all">všechny stavy</option>
                {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredSources.length}/{sources.length}</Badge>
              <Button variant="outline" size="sm" onClick={resetFilters} disabled={!activeFilters}>
                <RotateCcw size={15} /> Reset
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <TableWrapper className="max-h-[620px]">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                {["Zdroj", "Header From", "Provider", "Objem", "DMARC", "SPF", "DKIM", "SPF domény", "DKIM domény", "Stav"].map((head) => (
                  <TableHead key={head}>{head}</TableHead>
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
                    <TableCell>
                      <button className="inline-flex max-w-[220px] items-center gap-2 text-left font-medium text-slate-950" onClick={() => setExpandedSource(expandedSource === source.source_key ? null : source.source_key)}>
                        <ChevronDown size={15} className={expandedSource === source.source_key ? "rotate-180 transition" : "transition"} />
                        <span className="break-all">{source.source_ip}</span>
                      </button>
                      <small className="mt-1 block max-w-[220px] truncate text-xs text-slate-400">{source.reverse_dns || "bez reverse DNS"}</small>
                    </TableCell>
                    <TableCell className="max-w-[170px] truncate font-medium text-slate-700" title={source.header_from}>{source.header_from || domains(source.header_from_domains)}</TableCell>
                    <TableCell className="max-w-[230px] truncate text-slate-500" title={source.provider_name || "Neznámý"}>{source.provider_name || "Neznámý"}</TableCell>
                    <TableCell className="font-semibold text-slate-950">{formatNumber(source.total_count)}</TableCell>
                    <TableCell><span className={resultPill(source.dmarc)}>{resultLabel(source.dmarc)}</span><div className="mt-1 text-xs text-slate-400">{source.dmarc_pass_rate} %</div></TableCell>
                    <TableCell><span className={resultPill(source.spf)}>{resultLabel(source.spf)}</span><div className="mt-1 text-xs text-slate-400">{formatNumber(source.spf_policy_pass_count)} / {formatNumber(source.spf_policy_fail_count)}</div></TableCell>
                    <TableCell><span className={resultPill(source.dkim)}>{resultLabel(source.dkim)}</span><div className="mt-1 text-xs text-slate-400">{formatNumber(source.dkim_policy_pass_count)} / {formatNumber(source.dkim_policy_fail_count)}</div></TableCell>
                    <TableCell className="max-w-[170px] truncate text-slate-500" title={source.spf_domains?.join(", ")}>{domains(source.spf_domains)}</TableCell>
                    <TableCell className="max-w-[170px] truncate text-slate-500" title={source.dkim_domains?.join(", ")}>{domains(source.dkim_domains)}</TableCell>
                    <TableCell>
                      <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60">
                        {CLASSIFICATION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                      <div className="mt-1 text-xs text-slate-400">{classLabel(source.classification)}</div>
                    </TableCell>
                  </TableRow>
                  {expandedSource === source.source_key && (
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                      <TableCell colSpan={10} className="px-5 py-4">
                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
            <span>Strana {safePage} / {totalPages} · {filteredSources.length} záznamů</span>
            <label className="flex items-center gap-2">
              <span>Na stránku</span>
              <select value={pageSize} onChange={(event) => changePageSize(event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400">
                {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={15} /> Zpět
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Další <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
