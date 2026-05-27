"use client";

import { AlertCircle, CalendarClock, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "../components/ui/table";
import { Dashboard, ReportRow, TimelineMode, emptyDashboard, formatDate, formatNumber, percent } from "../lib";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function Pager({ page, totalPages, total, pageSize, setPage, setPageSize }: { page: number; totalPages: number; total: number; pageSize: number; setPage: (value: number | ((current: number) => number)) => void; setPageSize: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
        <span>Strana {page} / {totalPages} · {total} záznamů</span>
        <label className="flex items-center gap-2">
          <span>Na stránku</span>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400">
            {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          <ChevronLeft size={15} /> Zpět
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
          Další <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

function HistoryContent() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("report");
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState("");
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelinePageSize, setTimelinePageSize] = useState(10);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(10);

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
  const timelineTotalPages = Math.max(1, Math.ceil(timelineRows.length / timelinePageSize));
  const safeTimelinePage = Math.min(timelinePage, timelineTotalPages);
  const pagedTimelineRows = timelineRows.slice((safeTimelinePage - 1) * timelinePageSize, safeTimelinePage * timelinePageSize);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const importCmp = (b.created_at || "").localeCompare(a.created_at || "");
      if (importCmp !== 0) return importCmp;
      const beginCmp = (b.date_begin || "").localeCompare(a.date_begin || "");
      if (beginCmp !== 0) return beginCmp;
      return (b.date_end || "").localeCompare(a.date_end || "");
    });
  }, [reports]);
  const reportsTotalPages = Math.max(1, Math.ceil(sortedReports.length / reportsPageSize));
  const safeReportsPage = Math.min(reportsPage, reportsTotalPages);
  const pagedReports = sortedReports.slice((safeReportsPage - 1) * reportsPageSize, safeReportsPage * reportsPageSize);

  return (
    <main className="min-h-screen bg-white px-4 py-4 text-slate-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1680px] flex-col gap-6">
        <NavHeader />

        {error && (
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-none">
            <AlertCircle size={18} />
            {error}
          </Card>
        )}

        <div className="grid flex-1 gap-6 lg:grid-rows-2">
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <CalendarClock size={18} className="text-blue-600" />
                    Vývoj v čase
                  </CardTitle>
                  <CardDescription className="mt-2">{timelineMode === "report" ? "Podle období uvnitř DMARC XML reportů." : "Podle data importu."}</CardDescription>
                </div>
                <div className="inline-flex rounded-xl border border-slate-200 p-1">
                  <Button variant={timelineMode === "report" ? "default" : "ghost"} size="sm" onClick={() => { setTimelineMode("report"); setTimelinePage(1); }}>Období reportu</Button>
                  <Button variant={timelineMode === "import" ? "default" : "ghost"} size="sm" onClick={() => { setTimelineMode("import"); setTimelinePage(1); }}>Datum importu</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper className="max-h-[360px]">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="hover:bg-slate-50"><TableHead>Datum</TableHead><TableHead>Celkem</TableHead><TableHead>Pass</TableHead><TableHead>Fail</TableHead><TableHead>Pass rate</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineRows.length === 0 ? (
                      <TableRow><TableCell className="py-10 text-center text-slate-500" colSpan={5}>Zatím nejsou importovaná data.</TableCell></TableRow>
                    ) : pagedTimelineRows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="whitespace-nowrap font-medium text-slate-950">{row.date}</TableCell>
                        <TableCell>{formatNumber(row.total)}</TableCell>
                        <TableCell>{formatNumber(row.pass)}</TableCell>
                        <TableCell>{formatNumber(row.fail)}</TableCell>
                        <TableCell className="font-medium text-slate-950">{percent(row.pass, row.total)} %</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
              <Pager page={safeTimelinePage} totalPages={timelineTotalPages} total={timelineRows.length} pageSize={timelinePageSize} setPage={setTimelinePage} setPageSize={setTimelinePageSize} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileText size={18} className="text-blue-600" />
                Importované reporty
              </CardTitle>
              <CardDescription>Období reportu a datum importu jsou zobrazené odděleně.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper className="max-h-[420px]">
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow className="hover:bg-slate-50"><TableHead>Organizace</TableHead><TableHead>Doména</TableHead><TableHead>Období reportu</TableHead><TableHead>Datum importu</TableHead><TableHead>Zprávy</TableHead><TableHead>Záznamy</TableHead><TableHead>Soubor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow><TableCell className="py-10 text-center text-slate-500" colSpan={7}>Zatím nejsou importované reporty.</TableCell></TableRow>
                    ) : pagedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="max-w-[210px] truncate font-medium text-slate-700">{report.org_name || "-"}</TableCell>
                        <TableCell className="max-w-[170px] truncate font-medium text-slate-950">{report.domain || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(report.date_begin)} až {formatDate(report.date_end)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(report.created_at)}</TableCell>
                        <TableCell className="font-medium text-slate-950">{formatNumber(report.messages)}</TableCell>
                        <TableCell>{formatNumber(report.records)}</TableCell>
                        <TableCell className="max-w-[360px] break-words text-slate-500">{report.source_filename || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
              <Pager page={safeReportsPage} totalPages={reportsTotalPages} total={sortedReports.length} pageSize={reportsPageSize} setPage={setReportsPage} setPageSize={setReportsPageSize} />
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
