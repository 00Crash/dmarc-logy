import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, UploadCloud } from "lucide-react";
import { Dashboard, formatDate, formatNumber } from "../lib";

function StatCard({ label, value, helper, children }: { label: string; value: string; helper: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</div>
          <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{helper}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function IconBox({ children, className = "bg-blue-50 text-blue-600" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${className}`}>{children}</div>;
}

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Celkem zpráv" value={formatNumber(dashboard.total_messages)} helper="Součet položek count.">
        <IconBox><MailCheck size={21} /></IconBox>
      </StatCard>

      <StatCard label="DMARC pass" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail.`}>
        <IconBox className="bg-emerald-50 text-emerald-600"><ShieldCheck size={21} /></IconBox>
      </StatCard>

      <StatCard label="Zdroje" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(dashboard.unknown_sources)} neznámé/problémové.`}>
        <IconBox className="bg-violet-50 text-violet-600"><Server size={21} /></IconBox>
      </StatCard>

      <StatCard label="Reporty" value={formatNumber(dashboard.reports_count)} helper={`${formatNumber(dashboard.domains_count)} domén.`}>
        <IconBox className="bg-amber-50 text-amber-600"><FileText size={21} /></IconBox>
      </StatCard>

      <StatCard label="Období reportů" value={formatDate(dashboard.first_report_date)} helper={`Do ${formatDate(dashboard.last_report_date)} · Datum uvnitř XML.`}>
        <IconBox className="bg-sky-50 text-sky-600"><CalendarDays size={21} /></IconBox>
      </StatCard>

      <StatCard label="Importováno" value={formatDate(dashboard.first_import_date)} helper={`Do ${formatDate(dashboard.last_import_date)} · Datum uložení.`}>
        <IconBox className="bg-blue-50 text-blue-600"><UploadCloud size={21} /></IconBox>
      </StatCard>
    </section>
  );
}
