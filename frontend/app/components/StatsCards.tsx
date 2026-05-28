import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Dashboard, formatDate, formatNumber } from "../lib";
import { Card, CardContent } from "./ui/card";

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <Card className="h-full min-h-0 shadow-none hover:shadow-sm">
      <CardContent className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
          <div className="mt-0.5 truncate text-sm font-semibold tracking-tight text-slate-950">{value}</div>
          <p className="mt-0 truncate text-[10px] leading-tight text-slate-500">{helper}</p>
        </div>
        <div className="flex h-full items-center text-blue-600">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid h-full min-h-0 grid-cols-6 gap-2">
      <StatCard label="Celkem zpráv" value={formatNumber(dashboard.total_messages)} helper="Součet count." icon={<MailCheck size={15} />} />
      <StatCard label="DMARC pass" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail.`} icon={<ShieldCheck size={15} />} />
      <StatCard label="Zdroje" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(dashboard.unknown_sources)} neznámé.`} icon={<Server size={15} />} />
      <StatCard label="Reporty" value={formatNumber(dashboard.reports_count)} helper={`${formatNumber(dashboard.domains_count)} domén.`} icon={<FileText size={15} />} />
      <StatCard label="Období" value={formatDate(dashboard.first_report_date)} helper={`Do ${formatDate(dashboard.last_report_date)}`} icon={<CalendarDays size={15} />} />
      <StatCard label="Import" value={formatDate(dashboard.first_import_date)} helper={`Do ${formatDate(dashboard.last_import_date)}`} icon={<UploadCloud size={15} />} />
    </section>
  );
}
