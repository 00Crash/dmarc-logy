"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Recommendation, priorityClass } from "../lib";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "./ui/table";

function priorityLabel(value: string) {
  if (value === "critical") return "kritická";
  if (value === "medium") return "střední";
  if (value === "low") return "nízká";
  return value;
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  const pageSize = 4;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(recommendations.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => recommendations.slice((safePage - 1) * pageSize, safePage * pageSize), [recommendations, safePage]);

  return (
    <Card className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-none">
      <CardHeader className="border-b border-slate-100 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={16} className="text-blue-600" />
            Doporučení
          </CardTitle>
          <div className="text-xs text-slate-500">{recommendations.length}</div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 p-0">
        <TableWrapper className="h-full overflow-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="hover:bg-slate-50">
                <TableHead className="py-2">Priorita</TableHead>
                <TableHead className="py-2">Zdroj</TableHead>
                <TableHead className="py-2">Problém</TableHead>
                <TableHead className="py-2">Doporučená akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-[164px] text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-600" />Zatím nejsou doporučení.</span>
                  </TableCell>
                </TableRow>
              ) : paged.map((item, index) => (
                <TableRow key={`${item.source_ip}-${index}`} className="h-[41px]">
                  <TableCell className="py-2"><span className={priorityClass(item.priority)}><AlertTriangle size={13} />{priorityLabel(item.priority)}</span></TableCell>
                  <TableCell className="py-2 font-mono text-xs font-medium text-slate-700" title={item.source_ip}>{item.source_ip || "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate py-2 text-sm font-medium text-slate-950" title={item.title}>{item.title}</TableCell>
                  <TableCell className="max-w-[760px] truncate py-2 text-sm text-slate-600" title={item.detail}>{item.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </CardContent>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span>Strana {safePage} / {totalPages} · 4 řádky</span>
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
