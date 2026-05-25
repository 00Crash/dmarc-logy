import { CalendarDays, FileText, MailCheck, Server, ShieldCheck, TrendingUp } from "lucide-react";
import { Dashboard, formatDate, formatNumber } from "../lib";

const cardBase = "rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  const stats = [
    { label: "Zprávy", value: formatNumber(dashboard.total_messages), accent: "bg-blue-50 text-blue-600", Icon: MailCheck },
    { label: "DMARC pass", value: `${dashboard.dmarc_pass_rate} %`, accent: "bg-emerald-50 text-emerald-600", Icon: ShieldCheck },
    { label: "Zdroje", value: formatNumber(dashboard.unique_sources), accent: "bg-violet-50 text-violet-600", Icon: Server },
    { label: "Reporty", value: formatNumber(dashboard.reports_count), accent: "bg-amber-50 text-amber-600", Icon: FileText },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, accent, Icon }) => (
        <div className={cardBase} key={label}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-500">{label}</div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
              <Icon size={21} strokeWidth={2.2} />
            </div>
          </div>
        </div>
      ))}

      <div className={`${cardBase} sm:col-span-2`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><TrendingUp size={16} /> Období reportů</div>
            <div className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950">
              {formatDate(dashboard.first_report_date)} — {formatDate(dashboard.last_report_date)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDays size={16} /> Importováno</div>
            <div className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950">
              {formatDate(dashboard.first_import_date)} — {formatDate(dashboard.last_import_date)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
