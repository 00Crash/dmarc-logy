import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Recommendation } from "../lib";

function priorityLabel(value: string) {
  if (value === "critical") return "kritická";
  if (value === "medium") return "střední";
  if (value === "low") return "nízká";
  return value;
}

function priorityClass(value: string) {
  if (value === "critical") return "bg-red-50 text-red-700 ring-red-200";
  if (value === "medium") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Doporučení</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{recommendations.length} položek</p>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="flex items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500">
          <CheckCircle2 size={20} className="text-emerald-500" /> Bez doporučení.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Priorita</th>
                <th className="px-5 py-4">Zdroj</th>
                <th className="px-5 py-4">Problém</th>
                <th className="px-5 py-4">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recommendations.map((item, index) => (
                <tr key={`${item.source_ip}-${index}`} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${priorityClass(item.priority)}`}>
                      <AlertTriangle size={13} /> {priorityLabel(item.priority)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top font-mono font-semibold text-slate-700">{item.source_ip || "-"}</td>
                  <td className="px-5 py-4 align-top font-bold text-slate-950">{item.title}</td>
                  <td className="px-5 py-4 align-top leading-6 text-slate-600">{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
