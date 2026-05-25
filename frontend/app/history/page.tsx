"use client";

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
    <main className="app-shell">
      <NavHeader />
      {error && <div className="notice error page-notice">{error}</div>}
      <div className="history-frame">
        <section className="card panel full-width history-card">
          <div className="section-header">
            <div>
              <h2>Vývoj v čase</h2>
              <p>{timelineMode === "report" ? "Podle období uvnitř DMARC XML reportů." : "Podle data, kdy byly reporty importované do aplikace."}</p>
            </div>
            <div className="segmented">
              <button className={timelineMode === "report" ? "active" : ""} onClick={() => setTimelineMode("report")}>Období reportu</button>
              <button className={timelineMode === "import" ? "active" : ""} onClick={() => setTimelineMode("import")}>Datum importu</button>
            </div>
          </div>
          <div className="table-wrap history-timeline-panel">
            <table className="table compact fixed-table">
              <thead>
                <tr><th>Datum</th><th>Celkem</th><th>Pass</th><th>Fail</th><th>Pass rate</th></tr>
              </thead>
              <tbody>
                {timelineRows.length === 0 ? (
                  <tr><td colSpan={5}>Zatím nejsou importovaná data.</td></tr>
                ) : timelineRows.map((row) => (
                  <tr key={row.date}>
                    <td className="nowrap">{row.date}</td>
                    <td>{formatNumber(row.total)}</td>
                    <td>{formatNumber(row.pass)}</td>
                    <td>{formatNumber(row.fail)}</td>
                    <td>{percent(row.pass, row.total)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card panel full-width reports-card-history">
          <div className="section-header compact-header">
            <div>
              <h2>Importované reporty</h2>
              <p>Období reportu a datum importu jsou zobrazené odděleně.</p>
            </div>
          </div>
          <div className="table-wrap reports-panel-history">
            <table className="table compact reports-table-wide">
              <thead>
                <tr><th>Organizace</th><th>Doména</th><th>Období reportu</th><th>Datum importu</th><th>Zprávy</th><th>Záznamy</th><th>Soubor</th></tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={7}>Zatím nejsou importované reporty.</td></tr>
                ) : sortedReports.map((report) => (
                  <tr key={report.id}>
                    <td className="truncate-cell">{report.org_name || "-"}</td>
                    <td className="truncate-cell">{report.domain || "-"}</td>
                    <td className="nowrap">{formatDate(report.date_begin)} až {formatDate(report.date_end)}</td>
                    <td className="nowrap">{formatDate(report.created_at)}</td>
                    <td>{formatNumber(report.messages)}</td>
                    <td>{formatNumber(report.records)}</td>
                    <td className="file-cell">{report.source_filename || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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
