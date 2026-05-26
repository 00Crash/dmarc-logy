import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Dashboard, formatDate, formatNumber } from "../lib";
import { Card, CardContent } from "./ui/card";

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex h-full items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</div>
          <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{helper}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function IconBox({ children, className = "bg-blue-50 text-blue-600" }: { children: ReactNode; className?: string }) {
  return <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${className}`}>{children}</div>;
}

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Celkem zpráv" value={formatNumber(dashboard.total_messages)} helper="Součet položek count." icon={<IconBox><MailCheck size={21} /></IconBox>} />
      <StatCard label="DMARC pass" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail.`} icon={<IconBox className="bg-emerald-50 text-emerald-600"><ShieldCheck size={21} /></IconBox>} />
      <StatCard label="Zdroje" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(dashboard.unknown_sources)} neznámé/problémové.`} icon={<IconBox className="bg-violet-50 text-violet-600"><Server size={21} /></IconBox>} />
      <StatCard label="Reporty" value={formatNumber(dashboard.reports_count)} helper={`${formatNumber(dashboard.domains_count)} domén.`} icon={<IconBox className="bg-amber-50 text-amber-600"><FileText size={21} /></IconBox>} />
      <StatCard label="Období reportů" value={formatDate(dashboard.first_report_date)} helper={`Do ${formatDate(dashboard.last_report_date)} · Datum uvnitř XML.`} icon={<IconBox className="bg-sky-50 text-sky-600"><CalendarDays size={21} /></IconBox>} />
      <StatCard label="Importováno" value={formatDate(dashboard.first_import_date)} helper={`Do ${formatDate(dashboard.last_import_date)} · Datum uložení.`} icon={<IconBox className="bg-blue-50 text-blue-600"><UploadCloud size={21} /></IconBox>} />
    </section>
  );
}
