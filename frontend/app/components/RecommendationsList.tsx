"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Recommendation, priorityClass } from "../lib";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "./ui/table";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function priorityLabel(value: string) {
  if (value === "critical") return "kritická";
  if (value === "medium") return "střední";
  if (value === "low") return "nízká";
  return value;
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(recommendations.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => recommendations.slice((safePage - 1) * pageSize, safePage * pageSize), [recommendations, safePage, pageSize]);

  function changePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert size={18} className="text-blue-600" />
              Doporučení
            </CardTitle>
            <CardDescription className="mt-2">Úkoly podle SPF, DKIM a DMARC výsledků.</CardDescription>
          </div>
          <div className="text-sm text-slate-500">{recommendations.length}</div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <TableWrapper className="max-h-[420px]">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                <TableHead>Priorita</TableHead>
                <TableHead>Zdroj</TableHead>
                <TableHead>Problém</TableHead>
                <TableHead>Doporučená akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-600" />Zatím nejsou doporučení.</span>
                  </TableCell>
                </TableRow>
              ) : paged.map((item, index) => (
                <TableRow key={`${item.source_ip}-${index}`}>
                  <TableCell><span className={priorityClass(item.priority)}><AlertTriangle size={13} />{priorityLabel(item.priority)}</span></TableCell>
                  <TableCell className="font-mono text-sm font-medium text-slate-700" title={item.source_ip}>{item.source_ip || "-"}</TableCell>
                  <TableCell className="font-medium text-slate-950" title={item.title}>{item.title}</TableCell>
                  <TableCell className="leading-6 text-slate-600" title={item.detail}>{item.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
            <span>Strana {safePage} / {totalPages} · {recommendations.length} záznamů</span>
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
