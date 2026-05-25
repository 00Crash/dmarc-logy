"use client";

import { ArrowRight, CalendarRange, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Dashboard, ReportRow, SourceRow, emptyDashboard, formatNumber, percent } from "../lib";

type RangeKey = "latest" | "previous";

function StatCompare({ label, a, b, suffix = "" }: { label: string; a: number; b: number; suffix?: string }) {
  const diff = Math.round((b - a) * 100) / 100;
  const positive = diff >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-sm font-bold text-slate-500">
        <span>{label}</span>
        {positive ? <TrendingUp size={18} className="text-emerald-600" /> : <TrendingDown size={18} className="text-red-600" />}
      </div>
      <div className="flex items-end gap-3">
        <div className="text-2xl font-black text-slate-950">{formatNumber(a)}{suffix}</div>
        <ArrowRight size={18} className="mb-2 text-slate-400" />
        <div className="text-2xl font-black text-slate-950">{formatNumber(b)}{suffix}</div>
      </div>
      <div className={positive ? "mt-3 text-sm font-bold text-emerald-700" : "mt-3 text-sm font-bold text-red-700"}>
        {positive ? "+" : ""}{formatNumber(diff)}{suffix}
      </div>
    </div>
  );
}

function CompareContent() {
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [modeA, setModeA] = useState<RangeKey>("previous");
  const [modeB, setModeB] = useState<RangeKey>("latest");
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

  const sortedTimeline = useMemo(() => [...dashboard.timeline].sort((a, b) => a.date.localeCompare(b.date)), [dashboard.timeline]);
  const latest = sortedTimeline.at(-1) || { date: "-", total: 0, pass: 0, fail: 0 };
  const previous = sortedTimeline.at(-2) || { date: "-", total: 0, pass: 0, fail: 0 };
  const pick = (mode: RangeKey) => mode === "latest" ? latest : previous;
  const a = pick(modeA);
  const b = pick(modeB);

  const newSources = useMemo(() => sources.filter((source) => source.classification === "unknown" || source.classification === "suspicious").slice(0, 12), [sources]);

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Trendy</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Porovnání období</h1>
            </div>
            <div className="flex gap-3">
              <select value={modeA} onChange={(event) => setModeA(event.target.value as RangeKey)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
                <option value="previous">Předchozí období</option>
                <option value="latest">Poslední období</option>
              </select>
              <select value={modeB} onChange={(event) => setModeB(event.target.value as RangeKey)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
                <option value="latest">Poslední období</option>
                <option value="previous">Předchozí období</option>
              </select>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarRange size={21} /></div>
              <div className="font-bold text-slate-950">{a.date} <span className="text-slate-400">vs</span> {b.date}</div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-4">
            <StatCompare label="Zprávy" a={a.total} b={b.total} />
            <StatCompare label="Pass" a={a.pass} b={b.pass} />
            <StatCompare label="Fail" a={a.fail} b={b.fail} />
            <StatCompare label="Pass rate" a={percent(a.pass, a.total)} b={percent(b.pass, b.total)} suffix=" %" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Zdroje k ověření</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-4">IP</th><th className="px-5 py-4">Doména</th><th className="px-5 py-4">Objem</th><th className="px-5 py-4">Stav</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newSources.length === 0 ? <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={4}>Bez rizikových zdrojů.</td></tr> : newSources.map((source) => (
                    <tr key={source.source_key}><td className="px-5 py-4 font-bold text-blue-600">{source.source_ip}</td><td className="px-5 py-4">{source.header_from}</td><td className="px-5 py-4 font-bold">{formatNumber(source.total_count)}</td><td className="px-5 py-4">{source.classification}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="text-sm font-medium text-slate-500">Importované reporty v databázi: {formatNumber(reports.length)}</div>
        </div>
      </section>
      <AppVersionFooter />
    </main>
  );
}

export default function ComparePage() {
  return <AuthGate><CompareContent /></AuthGate>;
}
