"use client";

import { useEffect, useState } from "react";
import AuthGate from "./components/AuthGate";
import AppVersionFooter from "./components/AppVersionFooter";
import NavHeader from "./components/NavHeader";
import RecommendationsList from "./components/RecommendationsList";
import SourcesTable from "./components/SourcesTable";
import StatsCards from "./components/StatsCards";
import { Dashboard, Recommendation, SourceRow, emptyDashboard } from "./lib";

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

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <NavHeader />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Přehled</h1>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <StatsCards dashboard={dashboard} />
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
