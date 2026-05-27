import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Dashboard, formatDate, formatNumber } from "../lib";
import { Card, CardContent } from "./ui/card";

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <Card className="min-h-[132px] shadow-none hover:shadow-sm">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            {icon}
          </div>
        </div>
        <div>
          <div className="truncate text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <StatCard label="Celkem zpráv" value={formatNumber(dashboard.total_messages)} helper="Součet položek count." icon={<MailCheck size={18} />} />
      <StatCard label="DMARC pass" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail.`} icon={<ShieldCheck size={18} />} />
      <StatCard label="Zdroje" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(dashboard.unknown_sources)} neznámé/problémové.`} icon={<Server size={18} />} />
      <StatCard label="Reporty" value={formatNumber(dashboard.reports_count)} helper={`${formatNumber(dashboard.domains_count)} domén.`} icon={<FileText size={18} />} />
      <StatCard label="Období reportů" value={formatDate(dashboard.first_report_date)} helper={`Do ${formatDate(dashboard.last_report_date)} · Datum uvnitř XML.`} icon={<CalendarDays size={18} />} />
      <StatCard label="Importováno" value={formatDate(dashboard.first_import_date)} helper={`Do ${formatDate(dashboard.last_import_date)} · Datum uložení.`} icon={<UploadCloud size={18} />} />
    </section>
  );
}
