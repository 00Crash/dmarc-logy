"use client";

import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Dashboard, ReportRow, SourceRow, emptyDashboard, formatDate, formatNumber } from "../lib";

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

  async function exportPdf() {
    try {
      setError("");
      const [{ default: PDFDocument }, { default: blobStream }] = await Promise.all([
        import("pdfkit/js/pdfkit.standalone.js"),
        import("blob-stream"),
      ]);

      const doc = new PDFDocument({ margin: 42, size: "A4" });
      const stream = doc.pipe(blobStream());
      const now = new Date().toLocaleString("cs-CZ");
      const topSources = [...sources].sort((a, b) => b.total_count - a.total_count).slice(0, 18);
      const latestReports = [...reports].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 14);

      function line(y: number) {
        doc.moveTo(42, y).lineTo(553, y).strokeColor("#e2e8f0").lineWidth(1).stroke();
      }

      function section(title: string) {
        doc.moveDown(1.2);
        doc.fontSize(14).fillColor("#0f172a").font("Helvetica-Bold").text(title);
        doc.moveDown(0.4);
        line(doc.y);
        doc.moveDown(0.6);
      }

      function table(headers: string[], rows: string[][], widths: number[]) {
        const startX = 42;
        let y = doc.y;
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#475569");
        headers.forEach((header, index) => {
          const x = startX + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
          doc.text(header, x, y, { width: widths[index], continued: false });
        });
        y += 18;
        doc.moveTo(startX, y - 5).lineTo(553, y - 5).strokeColor("#e2e8f0").stroke();
        doc.font("Helvetica").fillColor("#0f172a");
        rows.forEach((row) => {
          if (y > 745) {
            doc.addPage();
            y = 42;
          }
          row.forEach((cell, index) => {
            const x = startX + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
            doc.text(String(cell || "-").slice(0, 42), x, y, { width: widths[index], height: 24, ellipsis: true });
          });
          y += 24;
          doc.moveTo(startX, y - 6).lineTo(553, y - 6).strokeColor("#f1f5f9").stroke();
        });
        doc.y = y + 6;
      }

      doc.font("Helvetica-Bold").fontSize(24).fillColor("#0f172a").text("DMARC Logy", 42, 42);
      doc.font("Helvetica").fontSize(10).fillColor("#64748b").text(`PDF report · ${now}`, 42, 72);
      doc.roundedRect(420, 42, 132, 44, 10).fillAndStroke("#eff6ff", "#bfdbfe");
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#2563eb").text(`${dashboard.dmarc_pass_rate} %`, 438, 52);
      doc.font("Helvetica").fontSize(8).fillColor("#475569").text("DMARC pass", 438, 73);

      section("Souhrn");
      const summaryY = doc.y;
      const cards = [
        ["Zprávy", formatNumber(dashboard.total_messages)],
        ["Zdroje", formatNumber(dashboard.unique_sources)],
        ["Reporty", formatNumber(dashboard.reports_count)],
        ["Neznámé", formatNumber(dashboard.unknown_sources)],
      ];
      cards.forEach(([label, value], index) => {
        const x = 42 + index * 128;
        doc.roundedRect(x, summaryY, 116, 48, 8).fillAndStroke("#ffffff", "#e2e8f0");
        doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(label, x + 10, summaryY + 9, { width: 96 });
        doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text(value, x + 10, summaryY + 24, { width: 96 });
      });
      doc.y = summaryY + 58;

      section("Top zdroje");
      table(
        ["IP", "Doména", "Provider", "Objem", "DMARC", "SPF", "DKIM"],
        topSources.map((item) => [item.source_ip, item.header_from, item.provider_name || "-", formatNumber(item.total_count), item.dmarc, item.spf, item.dkim]),
        [78, 92, 105, 55, 55, 55, 55]
      );

      section("Importované reporty");
      table(
        ["Doména", "Organizace", "Období", "Import", "Zprávy", "Záznamy"],
        latestReports.map((item) => [item.domain || "-", item.org_name || "-", `${formatDate(item.date_begin)} - ${formatDate(item.date_end)}`, formatDate(item.created_at), formatNumber(item.messages), formatNumber(item.records)]),
        [88, 118, 102, 78, 58, 58]
      );

      doc.end();
      stream.on("finish", () => {
        const blob = stream.toBlob("application/pdf");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "dmarc-report.pdf";
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    }
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

          <div className="grid gap-4 lg:grid-cols-4">
            <button onClick={exportPdf} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText size={23} /></div>
              <div className="text-xl font-bold text-slate-950">PDF report</div>
              <p className="mt-2 text-sm font-medium text-slate-500">Souhrn, metriky a tabulky pro audit.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"><Download size={16} /> Stáhnout</div>
            </button>

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
