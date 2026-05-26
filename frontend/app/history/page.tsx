"use client";

import { AlertCircle, CalendarClock, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Dashboard, ReportRow, TimelineMode, emptyDashboard, formatDate, formatNumber, percent } from "../lib";

function HistoryContent() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("report");
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState("");

  async function loadData(mode: TimelineMode = timelineMode) {
    const [d, r] = await Promise.all([
      fetch(`/api/dashboard?timeline_mode=${mode}`, { credentials: "include" }).then((res) => res.json()),
      fetch("/api/reports", { credentials: "include" }).then((res) => res.json())
    ]);
    setDashboard(d);
    setReports(r);
  }

  useEffect(() => {
    loadData(timelineMode).catch((err) => setError(String(err)));
  }, [timelineMode]);

  const timelineRows = useMemo(() => [...dashboard.timeline].sort((a, b) => b.date.localeCompare(a.date)), [dashboard.timeline]);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const importCmp = (b.created_at || "").localeCompare(a.created_at || "");
      if (importCmp !== 0) return importCmp;
      const beginCmp = (b.date_begin || "").localeCompare(a.date_begin || "");
      if (beginCmp !== 0) return beginCmp;
      return (b.date_end || "").localeCompare(a.date_end || "");
    });
  }, [reports]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-4 text-slate-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1760px] flex-col gap-4">
        <NavHeader />

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid flex-1 gap-4 lg:grid-rows-2">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarClock size={21} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight text-slate-950">Vývoj v čase</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    {timelineMode === "report" ? "Podle období uvnitř DMARC XML reportů." : "Podle data, kdy byly reporty importované do aplikace."}
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button className={timelineMode === "report" ? "rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm" : "px-4 py-2 text-sm font-black text-slate-500"} onClick={() => setTimelineMode("report")}>Období reportu</button>
                <button className={timelineMode === "import" ? "rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm" : "px-4 py-2 text-sm font-black text-slate-500"} onClick={() => setTimelineMode("import")}>Datum importu</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                  <tr><th className="border-b border-slate-200 px-4 py-3">Datum</th><th className="border-b border-slate-200 px-4 py-3">Celkem</th><th className="border-b border-slate-200 px-4 py-3">Pass</th><th className="border-b border-slate-200 px-4 py-3">Fail</th><th className="border-b border-slate-200 px-4 py-3">Pass rate</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timelineRows.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>Zatím nejsou importovaná data.</td></tr>
                  ) : timelineRows.map((row) => (
                    <tr key={row.date} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">{row.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{formatNumber(row.total)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{formatNumber(row.pass)}</td>
                      <td className="px-4 py-3 font-bold text-red-700">{formatNumber(row.fail)}</td>
                      <td className="px-4 py-3 font-black text-slate-950">{percent(row.pass, row.total)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FileText size={21} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">Importované reporty</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Období reportu a datum importu jsou zobrazené odděleně.</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                  <tr><th className="border-b border-slate-200 px-4 py-3">Organizace</th><th className="border-b border-slate-200 px-4 py-3">Doména</th><th className="border-b border-slate-200 px-4 py-3">Období reportu</th><th className="border-b border-slate-200 px-4 py-3">Datum importu</th><th className="border-b border-slate-200 px-4 py-3">Zprávy</th><th className="border-b border-slate-200 px-4 py-3">Záznamy</th><th className="border-b border-slate-200 px-4 py-3">Soubor</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>Zatím nejsou importované reporty.</td></tr>
                  ) : sortedReports.map((report) => (
                    <tr key={report.id} className="transition hover:bg-slate-50/80">
                      <td className="max-w-[210px] truncate px-4 py-3 font-semibold text-slate-700">{report.org_name || "-"}</td>
                      <td className="max-w-[170px] truncate px-4 py-3 font-black text-slate-950">{report.domain || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(report.date_begin)} až {formatDate(report.date_end)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(report.created_at)}</td>
                      <td className="px-4 py-3 font-black text-slate-950">{formatNumber(report.messages)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{formatNumber(report.records)}</td>
                      <td className="max-w-[360px] break-words px-4 py-3 text-slate-500">{report.source_filename || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <AppVersionFooter />
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <AuthGate>
      <HistoryContent />
    </AuthGate>
  );
}
