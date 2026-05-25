"use client";

import { CalendarClock, FileText, History, RefreshCcw } from "lucide-react";
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
      fetch("/api/reports", { credentials: "include" }).then((res) => res.json()),
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
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <NavHeader />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Historie</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Reporty</h1>
              </div>
              <button onClick={() => loadData()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                <RefreshCcw size={17} /> Obnovit
              </button>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarClock size={21} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Vývoj v čase</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{timelineRows.length} záznamů</p>
                </div>
              </div>
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button className={timelineMode === "report" ? "rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm" : "px-4 py-2 text-sm font-bold text-slate-500"} onClick={() => setTimelineMode("report")}>Období</button>
                <button className={timelineMode === "import" ? "rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm" : "px-4 py-2 text-sm font-bold text-slate-500"} onClick={() => setTimelineMode("import")}>Import</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-4">Datum</th><th className="px-5 py-4">Celkem</th><th className="px-5 py-4">Pass</th><th className="px-5 py-4">Fail</th><th className="px-5 py-4">Úspěšnost</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timelineRows.length === 0 ? (
                    <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={5}>Žádná data.</td></tr>
                  ) : timelineRows.map((row) => (
                    <tr key={row.date} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-bold text-slate-950">{row.date}</td>
                      <td className="px-5 py-4">{formatNumber(row.total)}</td>
                      <td className="px-5 py-4 text-emerald-700">{formatNumber(row.pass)}</td>
                      <td className="px-5 py-4 text-red-700">{formatNumber(row.fail)}</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{percent(row.pass, row.total)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><FileText size={21} /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Importované reporty</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{sortedReports.length} souborů</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-4">Organizace</th><th className="px-5 py-4">Doména</th><th className="px-5 py-4">Období</th><th className="px-5 py-4">Import</th><th className="px-5 py-4">Zprávy</th><th className="px-5 py-4">Záznamy</th><th className="px-5 py-4">Soubor</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedReports.length === 0 ? (
                    <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Žádné reporty.</td></tr>
                  ) : sortedReports.map((report) => (
                    <tr key={report.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-700">{report.org_name || "-"}</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{report.domain || "-"}</td>
                      <td className="px-5 py-4">{formatDate(report.date_begin)} — {formatDate(report.date_end)}</td>
                      <td className="px-5 py-4">{formatDate(report.created_at)}</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{formatNumber(report.messages)}</td>
                      <td className="px-5 py-4">{formatNumber(report.records)}</td>
                      <td className="max-w-[260px] truncate px-5 py-4 text-slate-500">{report.source_filename || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <AppVersionFooter />
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
