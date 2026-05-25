import { Recommendation, priorityClass } from "../lib";

function priorityLabel(value: string) {
  if (value === "critical") return "kritická";
  if (value === "medium") return "střední";
  if (value === "low") return "nízká";
  return value;
}

export default function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="card panel full-width recommendations-card-home">
      <div className="section-header compact-header recommendation-header">
        <div>
          <h2>Doporučení</h2>
          <p>Kompaktní seznam úkolů podle SPF/DKIM/DMARC výsledků.</p>
        </div>
        <span className="counter-pill">{recommendations.length}</span>
      </div>

      <div className="recommendations-table" role="table" aria-label="Doporučení">
        <div className="recommendations-row recommendations-head" role="row">
          <div role="columnheader">Priorita</div>
          <div role="columnheader">Zdroj</div>
          <div role="columnheader">Problém</div>
          <div role="columnheader">Doporučená akce</div>
        </div>

        {recommendations.length === 0 ? (
          <div className="recommendations-empty">Zatím nejsou doporučení.</div>
        ) : recommendations.map((item, index) => (
          <div className="recommendations-row" role="row" key={`${item.source_ip}-${index}`}>
            <div role="cell"><span className={priorityClass(item.priority)}>{priorityLabel(item.priority)}</span></div>
            <div role="cell" className="mono-cell rec-source-cell" title={item.source_ip}>{item.source_ip || "-"}</div>
            <div role="cell" className="rec-title" title={item.title}>{item.title}</div>
            <div role="cell" className="rec-detail" title={item.detail}>{item.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
