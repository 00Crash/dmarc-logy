import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Dashboard, formatDate, formatNumber } from "../lib";
import { Card, CardContent } from "./ui/card";

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <Card className="min-h-[118px] shadow-none hover:shadow-sm">
      <CardContent className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-8 truncate text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{helper}</p>
        </div>
        <div className="flex h-full items-center text-blue-600">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <StatCard label="Celkem zpráv" value={formatNumber(dashboard.total_messages)} helper="Součet položek count." icon={<MailCheck size={22} />} />
      <StatCard label="DMARC pass" value={`${dashboard.dmarc_pass_rate} %`} helper={`${formatNumber(dashboard.dmarc_pass_count)} pass / ${formatNumber(dashboard.dmarc_fail_count)} fail.`} icon={<ShieldCheck size={22} />} />
      <StatCard label="Zdroje" value={formatNumber(dashboard.unique_sources)} helper={`${formatNumber(dashboard.unknown_sources)} neznámé/problémové.`} icon={<Server size={22} />} />
      <StatCard label="Reporty" value={formatNumber(dashboard.reports_count)} helper={`${formatNumber(dashboard.domains_count)} domén.`} icon={<FileText size={22} />} />
      <StatCard label="Období reportů" value={formatDate(dashboard.first_report_date)} helper={`Do ${formatDate(dashboard.last_report_date)} · Datum uvnitř XML.`} icon={<CalendarDays size={22} />} />
      <StatCard label="Importováno" value={formatDate(dashboard.first_import_date)} helper={`Do ${formatDate(dashboard.last_import_date)} · Datum uložení.`} icon={<UploadCloud size={22} />} />
    </section>
  );
}
