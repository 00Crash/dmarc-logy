"use client";

import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Dashboard, ReportRow, SourceRow, emptyDashboard } from "../lib";

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function ExportContent() {
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState("");

  async function loadData() {
    const [d, s, r] = await Promise.all([
      fetch("/api/dashboard?timeline_mode=report", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/sources", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/reports", { credentials: "include" }).then((res) => res.json()),
    ]);
    setDashboard(d);
    setSources(s);
    setReports(r);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
  }, []);

  function exportSourcesCsv() {
    const header = ["source_ip", "header_from", "provider", "total", "dmarc", "spf", "dkim", "classification"];
    const rows = sources.map((item) => [item.source_ip, item.header_from, item.provider_name, item.total_count, item.dmarc, item.spf, item.dkim, item.classification].map(csvEscape).join(","));
    downloadFile("dmarc-sources.csv", [header.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  }

  function exportReportsCsv() {
    const header = ["domain", "org_name", "date_begin", "date_end", "messages", "records", "created_at", "file"];
    const rows = reports.map((item) => [item.domain, item.org_name, item.date_begin, item.date_end, item.messages, item.records, item.created_at, item.source_filename].map(csvEscape).join(","));
    downloadFile("dmarc-reports.csv", [header.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  }

  function exportJson() {
    downloadFile("dmarc-export.json", JSON.stringify({ dashboard, sources, reports }, null, 2), "application/json;charset=utf-8");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">Export</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Výstupy</h1>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div className="grid gap-4 lg:grid-cols-3">
            <button onClick={exportSourcesCsv} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileSpreadsheet size={23} /></div>
              <div className="text-xl font-bold text-slate-950">Zdroje CSV</div>
              <p className="mt-2 text-sm font-medium text-slate-500">IP adresy, domény, výsledky a stav zdroje.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"><Download size={16} /> Stáhnout</div>
            </button>

            <button onClick={exportReportsCsv} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><FileSpreadsheet size={23} /></div>
              <div className="text-xl font-bold text-slate-950">Reporty CSV</div>
              <p className="mt-2 text-sm font-medium text-slate-500">Historie importovaných reportů a období.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"><Download size={16} /> Stáhnout</div>
            </button>

            <button onClick={exportJson} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><FileJson size={23} /></div>
              <div className="text-xl font-bold text-slate-950">Kompletní JSON</div>
              <p className="mt-2 text-sm font-medium text-slate-500">Dashboard, zdroje i importované reporty.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"><Download size={16} /> Stáhnout</div>
            </button>
          </div>
        </div>
      </section>
      <AppVersionFooter />
    </main>
  );
}

export default function ExportPage() {
  return (
    <AuthGate>
      <ExportContent />
    </AuthGate>
  );
}
