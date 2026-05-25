"use client";

import { AlertTriangle, CheckCircle2, Globe2, Search, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import NavHeader from "../components/NavHeader";
import { SourceRow } from "../lib";

type DnsResult = {
  name: string;
  type: string;
  status: "ok" | "warn" | "bad";
  value: string;
  note: string;
};

async function dohTxt(name: string) {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, {
    headers: { accept: "application/dns-json" },
  });
  if (!res.ok) throw new Error("DNS dotaz selhal");
  const data = await res.json();
  return (data.Answer || []).map((item: { data: string }) => String(item.data).replaceAll('" "', '').replaceAll('"', '')) as string[];
}

function analyzeDmarc(value: string | undefined): DnsResult {
  if (!value) return { name: "_dmarc", type: "TXT", status: "bad", value: "-", note: "DMARC záznam nenalezen" };
  const lower = value.toLowerCase();
  if (!lower.includes("v=dmarc1")) return { name: "_dmarc", type: "TXT", status: "bad", value, note: "Neplatný DMARC záznam" };
  if (lower.includes("p=reject")) return { name: "_dmarc", type: "TXT", status: "ok", value, note: "Silná politika reject" };
  if (lower.includes("p=quarantine")) return { name: "_dmarc", type: "TXT", status: "ok", value, note: "Politika quarantine" };
  if (lower.includes("p=none")) return { name: "_dmarc", type: "TXT", status: "warn", value, note: "Monitoring bez vynucení" };
  return { name: "_dmarc", type: "TXT", status: "warn", value, note: "Chybí politika p=" };
}

function analyzeSpf(value: string | undefined): DnsResult {
  if (!value) return { name: "root", type: "TXT", status: "bad", value: "-", note: "SPF záznam nenalezen" };
  const lower = value.toLowerCase();
  if (!lower.includes("v=spf1")) return { name: "root", type: "TXT", status: "bad", value, note: "Neplatný SPF záznam" };
  const includeCount = (lower.match(/include:/g) || []).length;
  if (includeCount > 8) return { name: "root", type: "TXT", status: "warn", value, note: "Mnoho include pravidel" };
  if (lower.includes("-all")) return { name: "root", type: "TXT", status: "ok", value, note: "Tvrdé zakončení -all" };
  if (lower.includes("~all")) return { name: "root", type: "TXT", status: "ok", value, note: "Softfail ~all" };
  return { name: "root", type: "TXT", status: "warn", value, note: "Chybí all mechanismus" };
}

function statusIcon(status: DnsResult["status"]) {
  if (status === "ok") return <CheckCircle2 size={18} className="text-emerald-600" />;
  if (status === "warn") return <AlertTriangle size={18} className="text-amber-600" />;
  return <XCircle size={18} className="text-red-600" />;
}

function statusClass(status: DnsResult["status"]) {
  if (status === "ok") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "warn") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function DnsContent() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState<DnsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSources() {
    const s = await fetch("/api/sources", { credentials: "include" }).then((res) => res.json());
    setSources(s);
  }

  useEffect(() => {
    loadSources().catch(() => undefined);
  }, []);

  const domains = useMemo(() => {
    const values = new Set<string>();
    sources.forEach((source) => source.header_from_domains?.forEach((item) => item && values.add(item)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "cs"));
  }, [sources]);

  useEffect(() => {
    if (!domain && domains.length > 0) setDomain(domains[0]);
  }, [domains, domain]);

  async function runCheck() {
    if (!domain) return;
    setLoading(true);
    setError("");
    try {
      const [rootTxt, dmarcTxt] = await Promise.all([dohTxt(domain), dohTxt(`_dmarc.${domain}`)]);
      const spf = rootTxt.find((txt) => txt.toLowerCase().includes("v=spf1"));
      const dmarc = dmarcTxt.find((txt) => txt.toLowerCase().includes("v=dmarc1"));
      const selectors = ["default", "selector1", "selector2", "google", "mail"];
      const dkimResults = await Promise.all(selectors.map(async (selector) => {
        const name = `${selector}._domainkey.${domain}`;
        const txt = await dohTxt(name).catch(() => []);
        const value = txt.find((item) => item.toLowerCase().includes("v=dkim1") || item.toLowerCase().includes("p="));
        return { selector, value };
      }));
      const foundDkim = dkimResults.filter((item) => item.value);
      setResults([
        analyzeSpf(spf),
        analyzeDmarc(dmarc),
        { name: "DKIM", type: "TXT", status: foundDkim.length ? "ok" : "warn", value: foundDkim.map((item) => `${item.selector}: ${item.value}`).join(" | ") || "-", note: foundDkim.length ? `${foundDkim.length} selectorů nalezeno` : "Známé selectory nenalezeny" },
      ]);
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-slate-950">
      <NavHeader />
      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">DNS audit</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">DNS diagnostika</h1>
            </div>
            <button onClick={runCheck} disabled={loading || !domain} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300">
              <Search size={17} /> Zkontrolovat
            </button>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-600">Doména</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="firma.cz" className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              {domains.length > 0 && (
                <select value={domain} onChange={(event) => setDomain(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                  {domains.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              )}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {results.length === 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 lg:col-span-3">
                Zadejte doménu a spusťte diagnostiku.
              </section>
            ) : results.map((item) => (
              <section key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Globe2 size={21} /></div>
                    <div>
                      <h2 className="font-bold text-slate-950">{item.name}</h2>
                      <p className="text-sm font-medium text-slate-500">{item.type}</p>
                    </div>
                  </div>
                  {statusIcon(item.status)}
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(item.status)}`}>{item.note}</span>
                <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600">{item.value}</pre>
              </section>
            ))}
          </div>
        </div>
      </section>
      <AppVersionFooter />
    </main>
  );
}

export default function DnsPage() {
  return <AuthGate><DnsContent /></AuthGate>;
}
