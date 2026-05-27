"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AuthGate from "./components/AuthGate";
import AppVersionFooter from "./components/AppVersionFooter";
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
    <main className="min-h-screen bg-white px-4 py-4 text-slate-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1680px] flex-col gap-6">
        <NavHeader />

        {error && (
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            {error}
          </Card>
        )}

        <div className="grid flex-1 gap-6">
          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <ImportActions onDone={loadData} />
            <StatsCards dashboard={dashboard} />
          </section>

          <SourcesTable sources={sources} loading={loading} onClassificationChange={setClassification} />
          <RecommendationsList recommendations={recommendations} />
        </div>

        <AppVersionFooter />
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
