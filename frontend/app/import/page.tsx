"use client";

import { Activity, FileArchive, UploadCloud } from "lucide-react";
import AuthGate from "../components/AuthGate";
import AppVersionFooter from "../components/AppVersionFooter";
import ImportActions from "../components/ImportActions";
import NavHeader from "../components/NavHeader";

function ImportContent() {
  async function refresh() {
    return Promise.resolve();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <NavHeader />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Import</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Nahrát report</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UploadCloud size={24} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
            <ImportActions onDone={refresh} />

            <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FileArchive size={21} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Formáty</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">DMARC aggregate reporty</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {["XML", "ZIP", "GZ"].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700">
                Po importu se data automaticky objeví v Přehledu a Historii.
              </div>
            </section>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Activity size={21} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Stav</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Připraveno k importu</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <AppVersionFooter />
    </main>
  );
}

export default function ImportPage() {
  return (
    <AuthGate>
      <ImportContent />
    </AuthGate>
  );
}
