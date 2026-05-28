"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AuthGate from "./components/AuthGate";
import ImportActions from "./components/ImportActions";
import NavHeader from "./components/NavHeader";
import RecommendationsList from "./components/RecommendationsList";
import SourcesTable from "./components/SourcesTable";
import StatsCards from "./components/StatsCards";
import { Card } from "./components/ui/card";
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
      fetch("/api/recommendations", { credentials: "include" }).then((res) => res.json())
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
        body: JSON.stringify({ classification })
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-white px-4 py-2 text-slate-950">
      <div className="mx-auto grid h-full max-w-[1840px] grid-rows-[auto_minmax(0,1fr)] gap-2">
        <NavHeader />

        {error ? (
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 shadow-none">
            <AlertCircle size={15} />
            {error}
          </Card>
        ) : null}

        <div className="grid min-h-0 grid-rows-[60px_minmax(0,1fr)_260px] gap-2">
          <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
            <ImportActions onDone={loadData} />
            <StatsCards dashboard={dashboard} />
          </section>

          <SourcesTable sources={sources} loading={loading} onClassificationChange={setClassification} />
          <RecommendationsList recommendations={recommendations} />
        </div>
      </div>
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
