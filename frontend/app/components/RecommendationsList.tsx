"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Recommendation, priorityClass } from "../lib";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "./ui/table";

function priorityLabel(value: string) {
  if (value === "critical") return "kritick\u00e1";
  if (value === "medium") return "st\u0159edn\u00ed";
  if (value === "low") return "n\u00edzk\u00e1";
  return value;
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  const first4 = recommendations.slice(0, 4);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden shadow-none">
      <CardHeader className="shrink-0 border-b border-slate-100 px-4 py-1.5">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert size={14} className="text-blue-600" />
            Doporu\u010den\u00ed
          </CardTitle>
          <div className="text-xs text-slate-500">{recommendations.length}</div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <TableWrapper className="min-w-[900px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-0.5 text-[11px]">Priorita</TableHead>
                <TableHead className="py-0.5 text-[11px]">Zdroj</TableHead>
                <TableHead className="py-0.5 text-[11px]">Probl\u00e9m</TableHead>
                <TableHead className="py-0.5 text-[11px]">Doporu\u010den\u00e1 akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-[80px] text-center text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-blue-600" />\u017d\u00e1dn\u00e1 doporu\u010den\u00ed nejsou k dispozici.</span>
                  </TableCell>
                </TableRow>
              ) : first4.map((item, index) => (
                <TableRow key={`${item.source_ip}-${index}`} className="h-[38px]">
                  <TableCell className="py-1"><span className={priorityClass(item.priority)}><AlertTriangle size={11} />{priorityLabel(item.priority)}</span></TableCell>
                  <TableCell className="py-1 font-mono text-[11px] font-medium text-slate-700" title={item.source_ip}>{item.source_ip || "\u2014"}</TableCell>
                  <TableCell className="max-w-[260px] truncate py-1 text-xs font-medium text-slate-950" title={item.title}>{item.title}</TableCell>
                  <TableCell className="max-w-[760px] truncate py-1 text-xs text-slate-600" title={item.detail}>{item.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </CardContent>
    </Card>
  );
}
