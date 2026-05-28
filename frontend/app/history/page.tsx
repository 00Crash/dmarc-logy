"use client";

import { AlertCircle, CalendarClock, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import NavHeader from "../components/NavHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "../components/ui/table";
import { Dashboard, ReportRow, TimelineMode, emptyDashboard, formatDate, formatNumber, percent } from "../lib";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function Pager({ page, totalPages, total, pageSize, setPage, setPageSize }: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  setPage: (value: number | ((current: number) => number)) => void;
  setPageSize: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-1.5">
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span>Strana {page} / {totalPages} · {total} záznamů</span>
        <label className="flex items-center gap-1.5">
          Na stránku
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-slate-400"
          >
            {PAGE_SIZE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>
          <ChevronLeft size={11} /> Zpět
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={page >= totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>
          Další <ChevronRight size={11} />
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
  const [timelinePageSize, setTimelinePageSize] = useState(25);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(25);

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
    <main className="h-screen overflow-hidden bg-white px-4 py-2 text-slate-950">
      <div className="mx-auto grid h-full max-w-[1840px] grid-rows-[auto_minmax(0,1fr)] gap-2">
        <NavHeader />

        {error && (
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 shadow-none">
            <AlertCircle size={15} />
            {error}
          </Card>
        )}

        <div className="grid min-h-0 grid-rows-2 gap-2">

          <Card className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-1.5">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <CalendarClock size={14} className="text-blue-600" />
                Vývoj v čase
              </CardTitle>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                <Button variant={timelineMode === "report" ? "default" : "ghost"} size="sm" className="h-6 px-2.5 text-[11px]" onClick={() => { setTimelineMode("report"); setTimelinePage(1); }}>Období reportu</Button>
                <Button variant={timelineMode === "import" ? "default" : "ghost"} size="sm" className="h-6 px-2.5 text-[11px]" onClick={() => { setTimelineMode("import"); setTimelinePage(1); }}>Datum importu</Button>
              </div>
            </div>
            <CardContent className="min-h-0 p-0">
              <TableWrapper className="h-full overflow-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {["Datum", "Celkem", "Pass", "Fail", "Pass rate"].map((h) => (
                        <TableHead className="py-0.5 text-[11px]" key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineRows.length === 0 ? (
                      <TableRow><TableCell className="py-8 text-center text-xs text-slate-500" colSpan={5}>Zatím nejsou importovaná data.</TableCell></TableRow>
                    ) : pagedTimelineRows.map((row) => (
                      <TableRow key={row.date} className="h-[26px]">
                        <TableCell className="whitespace-nowrap py-0 text-[11px] font-medium text-slate-950">{row.date}</TableCell>
                        <TableCell className="py-0 text-[11px]">{formatNumber(row.total)}</TableCell>
                        <TableCell className="py-0 text-[11px]">{formatNumber(row.pass)}</TableCell>
                        <TableCell className="py-0 text-[11px]">{formatNumber(row.fail)}</TableCell>
                        <TableCell className="py-0 text-[11px] font-medium text-slate-950">{percent(row.pass, row.total)} %</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
            <Pager page={safeTimelinePage} totalPages={timelineTotalPages} total={timelineRows.length} pageSize={timelinePageSize} setPage={setTimelinePage} setPageSize={setTimelinePageSize} />
          </Card>

          <Card className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-none">
            <div className="flex items-center border-b border-slate-100 px-4 py-1.5">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <FileText size={14} className="text-blue-600" />
                Importované reporty
              </CardTitle>
            </div>
            <CardContent className="min-h-0 p-0">
              <TableWrapper className="h-full overflow-auto">
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {["Organizace", "Doména", "Období reportu", "Datum importu", "Zprávy", "Záznamy", "Soubor"].map((h) => (
                        <TableHead className="py-0.5 text-[11px]" key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow><TableCell className="py-8 text-center text-xs text-slate-500" colSpan={7}>Zatím nejsou importované reporty.</TableCell></TableRow>
                    ) : pagedReports.map((report, i) => (
                      <TableRow key={`${report.report_id}-${i}`} className="h-[26px]">
                        <TableCell className="max-w-[200px] truncate py-0 text-[11px] font-medium text-slate-950" title={report.org_name ?? ""}>{report.org_name || "—"}</TableCell>
                        <TableCell className="max-w-[180px] truncate py-0 text-[11px] text-slate-700" title={report.domain ?? ""}>{report.domain || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap py-0 text-[11px] text-slate-600">{formatDate(report.date_begin)} – {formatDate(report.date_end)}</TableCell>
                        <TableCell className="whitespace-nowrap py-0 text-[11px] text-slate-600">{formatDate(report.created_at)}</TableCell>
                        <TableCell className="py-0 text-[11px] font-semibold text-slate-950">{formatNumber(report.messages)}</TableCell>
                        <TableCell className="py-0 text-[11px] text-slate-500">{formatNumber(report.records)}</TableCell>
                        <TableCell className="max-w-[220px] truncate py-0 text-[11px] text-slate-400" title={report.source_filename ?? ""}>{report.source_filename || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
            <Pager page={safeReportsPage} totalPages={reportsTotalPages} total={sortedReports.length} pageSize={reportsPageSize} setPage={setReportsPage} setPageSize={setReportsPageSize} />
          </Card>

        </div>
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
