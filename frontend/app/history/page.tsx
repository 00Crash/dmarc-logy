"use client";

import { AlertCircle, CalendarClock, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-4 text-slate-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1760px] flex-col gap-4">
        <NavHeader />

        {error && (
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            {error}
          </Card>
        )}

        <div className="grid flex-1 gap-4 lg:grid-rows-2">
          <Card className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader className="flex-col gap-4 border-b border-slate-100 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarClock size={21} />
                </div>
                <div className="min-w-0">
                  <CardTitle>Vývoj v čase</CardTitle>
                  <CardDescription>{timelineMode === "report" ? "Podle období uvnitř DMARC XML reportů." : "Podle data, kdy byly reporty importované do aplikace."}</CardDescription>
                </div>
              </div>
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <Button variant={timelineMode === "report" ? "outline" : "ghost"} size="sm" className={timelineMode === "report" ? "bg-white text-blue-700 shadow-sm" : ""} onClick={() => setTimelineMode("report")}>Období reportu</Button>
                <Button variant={timelineMode === "import" ? "outline" : "ghost"} size="sm" className={timelineMode === "import" ? "bg-white text-blue-700 shadow-sm" : ""} onClick={() => setTimelineMode("import")}>Datum importu</Button>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto p-0">
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
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 space-y-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FileText size={21} />
              </div>
              <div>
                <CardTitle>Importované reporty</CardTitle>
                <CardDescription>Období reportu a datum importu jsou zobrazené odděleně.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto p-0">
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
            </CardContent>
          </Card>
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
