import { CalendarDays, FileText, MailCheck, Server, ShieldCheck } from "lucide-react";
import { Dashboard, formatDate, formatNumber } from "../lib";

const cardBase = "rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

function DateRangeCard({
  title,
  from,
  to,
  accent,
}: {
  title: string;
  from: string | null;
  to: string | null;
  accent: string;
}) {
  const start = formatDate(from);
  const end = formatDate(to);
  const empty = start === "-" && end === "-";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-500">{title}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
          <CalendarDays size={18} strokeWidth={2.2} />
        </div>
      </div>

      {empty ? (
        <div className="rounded-xl bg-white px-4 py-4 text-sm font-semibold text-slate-400">Bez dat</div>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Od</div>
            <div className="mt-1 text-lg font-bold tracking-tight text-slate-950">{start}</div>
          </div>
          <div className="h-px w-8 bg-slate-300" />
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Do</div>
            <div className="mt-1 text-lg font-bold tracking-tight text-slate-950">{end}</div>
          </div>
        </div>
      )}
    </div>
  );
}

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

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <DateRangeCard
            title="Období reportů"
            from={dashboard.first_report_date}
            to={dashboard.last_report_date}
            accent="bg-blue-50 text-blue-600"
          />
          <DateRangeCard
            title="Importováno"
            from={dashboard.first_import_date}
            to={dashboard.last_import_date}
            accent="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>
    </section>
  );
}
