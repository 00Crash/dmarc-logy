import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Recommendation, priorityClass } from "../lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

function priorityLabel(value: string) {
  if (value === "critical") return "kritická";
  if (value === "medium") return "střední";
  if (value === "low") return "nízká";
  return value;
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b border-slate-100 space-y-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldAlert size={21} />
          </div>
          <div className="min-w-0">
            <CardTitle>Doporučení</CardTitle>
            <CardDescription>Kompaktní seznam úkolů podle SPF/DKIM/DMARC výsledků.</CardDescription>
          </div>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-blue-50 px-3 text-sm font-black text-blue-700">{recommendations.length}</span>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3">Priorita</th>
              <th className="border-b border-slate-200 px-4 py-3">Zdroj</th>
              <th className="border-b border-slate-200 px-4 py-3">Problém</th>
              <th className="border-b border-slate-200 px-4 py-3">Doporučená akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recommendations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" />Zatím nejsou doporučení.</span>
                </td>
              </tr>
            ) : recommendations.map((item, index) => (
              <tr className="transition hover:bg-slate-50/80" key={`${item.source_ip}-${index}`}>
                <td className="px-4 py-3 align-top"><span className={priorityClass(item.priority)}><AlertTriangle size={13} />{priorityLabel(item.priority)}</span></td>
                <td className="px-4 py-3 align-top font-mono text-sm font-bold text-slate-700" title={item.source_ip}>{item.source_ip || "-"}</td>
                <td className="px-4 py-3 align-top font-black text-slate-950" title={item.title}>{item.title}</td>
                <td className="px-4 py-3 align-top font-medium leading-6 text-slate-600" title={item.detail}>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
