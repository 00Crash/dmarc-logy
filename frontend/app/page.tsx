"use client";

import { Activity, ArrowUpRight, CheckCircle2, Globe2, ShieldAlert, ShieldCheck, Wifi } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "./components/AuthGate";
import AppVersionFooter from "./components/AppVersionFooter";
import NavHeader from "./components/NavHeader";
import RecommendationsList from "./components/RecommendationsList";
import SourcesTable from "./components/SourcesTable";
import { Dashboard, Recommendation, SourceRow, emptyDashboard, formatNumber } from "./lib";

function MetricPanel({ title, value, helper, Icon, tone }: { title: string; value: string; helper: string; Icon: typeof ShieldCheck; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
        <Icon size={17} className={tone} />
        {title}
      </div>
      <div className="p-5">
        <div className="text-3xl font-bold tracking-tight text-slate-950">{value}</div>
        <div className="mt-2 text-sm font-medium text-slate-500">{helper}</div>
      </div>
    </div>
  );
}

function HomeContent() {
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [d, s, rec] = await Promise.all([
      fetch("/api/dashboard?timeline_mode=report", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/sources", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/recommendations", { credentials: "include" }).then((res) => res.json()),
    ]);
    setDashboard(d);
    setSources(s);
    setRecommendations(rec);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
  }, []);

  async function setClassification(sourceId: number | null, sourceIp: string, classification: string) {
    setLoading(true);
    try {
      const url = sourceId ? `/api/sources/by-id/${sourceId}` : `/api/sources/${encodeURIComponent(sourceIp)}`;
      await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification }),
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  const knownSources = useMemo(() => Math.max(0, dashboard.unique_sources - dashboard.unknown_sources), [dashboard]);

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Account home</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">DMARC Logy</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/import" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                Importovat <ArrowUpRight size={17} />
              </Link>
              <Link href="/charts" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Grafy <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-950">Analytics</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <MetricPanel title="Security" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail`} Icon={ShieldCheck} tone="text-emerald-600" />
              <MetricPanel title="Activity" value={formatNumber(dashboard.total_messages)} helper="zpracovaných zpráv" Icon={Activity} tone="text-blue-600" />
              <MetricPanel title="Sources" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(knownSources)} známé / ${formatNumber(dashboard.unknown_sources)} neznámé`} Icon={Wifi} tone="text-violet-600" />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Globe2 size={17} /> Domény</div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{formatNumber(dashboard.domains_count)}</span>
              </div>
              <div className="p-5 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(dashboard.reports_count)}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><ShieldAlert size={17} /> Doporučení</div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{recommendations.length}</span>
              </div>
              <div className="p-5 text-sm font-medium text-slate-500">Aktivní úkoly k ověření zdrojů a autentizace.</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 size={17} /> Stav</div>
              </div>
              <div className="p-5 text-sm font-medium text-slate-500">Přehled je aktualizovaný z importovaných DMARC reportů.</div>
            </div>
          </section>

          <SourcesTable sources={sources} loading={loading} onClassificationChange={setClassification} />
          <RecommendationsList recommendations={recommendations} />
        </div>
      </section>

      <AppVersionFooter />
    </main>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}
