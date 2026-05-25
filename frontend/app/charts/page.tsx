"use client";

import { Activity, BarChart3, Globe2, LineChart, PieChart, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { Dashboard, SourceRow, emptyDashboard, formatNumber, percent } from "../lib";

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-32 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-xl bg-blue-500/80" style={{ height: `${Math.max(8, (value / max) * 120)}px` }} />
        </div>
      ))}
    </div>
  );
}

function Donut({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#16a34a ${safe}%, #e2e8f0 0)` }}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-950">{safe}%</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-700">
        {icon}
        {title}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ChartsContent() {
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [error, setError] = useState("");

  async function loadData() {
    const [d, s] = await Promise.all([
      fetch("/api/dashboard?timeline_mode=report", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/sources", { credentials: "include" }).then((res) => res.json()),
    ]);
    setDashboard(d);
    setSources(s);
  }

  useEffect(() => {
    loadData().catch((err) => setError(String(err)));
  }, []);

  const timeline = useMemo(() => [...dashboard.timeline].sort((a, b) => a.date.localeCompare(b.date)), [dashboard.timeline]);
  const topSources = useMemo(() => [...sources].sort((a, b) => b.total_count - a.total_count).slice(0, 8), [sources]);
  const sourceValues = topSources.map((source) => source.total_count);
  const timelineValues = timeline.map((row) => row.total);
  const passFail = dashboard.dmarc_pass_count + dashboard.dmarc_fail_count;
  const failRate = passFail ? Math.round((dashboard.dmarc_fail_count / passFail) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Analytics</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Grafy</h1>
            </div>
            <button onClick={loadData} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Activity size={17} /> Obnovit
            </button>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="DMARC úspěšnost" icon={<ShieldCheck size={17} className="text-emerald-600" />}>
              <div className="flex items-center justify-center"><Donut value={dashboard.dmarc_pass_rate} /></div>
            </Panel>

            <Panel title="Fail rate" icon={<PieChart size={17} className="text-red-500" />}>
              <div className="flex items-center justify-center"><Donut value={failRate} /></div>
            </Panel>

            <Panel title="Objem zpráv" icon={<BarChart3 size={17} className="text-blue-600" />}>
              <div className="text-4xl font-bold tracking-tight text-slate-950">{formatNumber(dashboard.total_messages)}</div>
              <p className="mt-2 text-sm font-medium text-slate-500">celkem zpracováno</p>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Vývoj v čase" icon={<LineChart size={17} className="text-blue-600" />}>
              {timeline.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">Žádná data.</div>
              ) : (
                <>
                  <MiniBars values={timelineValues} />
                  <div className="mt-4 grid gap-2 text-sm">
                    {timeline.slice(-6).map((row) => (
                      <div key={row.date} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-600">{row.date}</span>
                        <span className="font-bold text-slate-950">{formatNumber(row.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            <Panel title="Top zdroje" icon={<Globe2 size={17} className="text-violet-600" />}>
              {topSources.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">Žádná data.</div>
              ) : (
                <div className="space-y-3">
                  {topSources.map((source) => {
                    const max = Math.max(1, ...sourceValues);
                    return (
                      <div key={source.source_key}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-semibold text-slate-700">{source.source_ip}</span>
                          <span className="font-bold text-slate-950">{formatNumber(source.total_count)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.max(4, (source.total_count / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="SPF / DKIM / DMARC přehled" icon={<TrendingUp size={17} className="text-orange-500" />}>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "DMARC", value: dashboard.dmarc_pass_rate },
                { label: "SPF", value: percent(sources.reduce((sum, item) => sum + item.spf_policy_pass_count, 0), sources.reduce((sum, item) => sum + item.spf_policy_pass_count + item.spf_policy_fail_count, 0)) },
                { label: "DKIM", value: percent(sources.reduce((sum, item) => sum + item.dkim_policy_pass_count, 0), sources.reduce((sum, item) => sum + item.dkim_policy_pass_count + item.dkim_policy_fail_count, 0)) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <AppVersionFooter />
    </main>
  );
}

export default function ChartsPage() {
  return (
    <AuthGate>
      <ChartsContent />
    </AuthGate>
  );
}
