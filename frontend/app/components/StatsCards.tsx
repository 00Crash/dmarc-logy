import { Dashboard, formatDate, formatNumber } from "../lib";

export default function StatsCards({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="stats-grid">
      <div className="card stat-card">
        <div className="metric-label">Celkem zpráv</div>
        <div className="metric">{formatNumber(dashboard.total_messages)}</div>
        <p>Součet položek count.</p>
      </div>
      <div className="card stat-card">
        <div className="metric-label">DMARC pass</div>
        <div className="metric">{dashboard.dmarc_pass_rate} %</div>
        <p>{formatNumber(dashboard.dmarc_pass_count)} pass / {formatNumber(dashboard.dmarc_fail_count)} fail.</p>
      </div>
      <div className="card stat-card">
        <div className="metric-label">Zdroje</div>
        <div className="metric">{formatNumber(dashboard.unique_sources)}</div>
        <p>{formatNumber(dashboard.unknown_sources)} neznámé/problémové.</p>
      </div>
      <div className="card stat-card">
        <div className="metric-label">Reporty</div>
        <div className="metric">{formatNumber(dashboard.reports_count)}</div>
        <p>{formatNumber(dashboard.domains_count)} domén.</p>
      </div>
      <div className="card stat-card">
        <div className="metric-label">Období reportů</div>
        <div className="metric small">{formatDate(dashboard.first_report_date)}<br />{formatDate(dashboard.last_report_date)}</div>
        <p>Datum uvnitř XML.</p>
      </div>
      <div className="card stat-card">
        <div className="metric-label">Importováno</div>
        <div className="metric small">{formatDate(dashboard.first_import_date)}<br />{formatDate(dashboard.last_import_date)}</div>
        <p>Datum uložení.</p>
      </div>
    </section>
  );
}
