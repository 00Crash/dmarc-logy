"use client";

import { Fragment, useMemo, useState } from "react";
import { SourceRow, classLabel, domains, formatNumber, resultLabel, resultPill } from "../lib";

type Props = {
  sources: SourceRow[];
  loading?: boolean;
  onClassificationChange: (sourceId: number | null, sourceIp: string, classification: string) => Promise<void>;
};

const CLASSIFICATION_OPTIONS = [
  { value: "known", label: "známý" },
  { value: "unknown", label: "neznámý" },
  { value: "suspicious", label: "podezřelý" },
  { value: "ignored", label: "ignorovaný" },
  { value: "needs_fix", label: "vyžaduje opravu" }
];

export default function SourcesTable({ sources, loading = false, onClassificationChange }: Props) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [headerFromFilter, setHeaderFromFilter] = useState("all");
  const DEFAULT_CLASSIFICATION_FILTER = "unknown";
  const [classificationFilter, setClassificationFilter] = useState(DEFAULT_CLASSIFICATION_FILTER);

  const headerFromOptions = useMemo(() => {
    const values = new Set<string>();
    for (const source of sources) {
      for (const domain of source.header_from_domains || []) {
        const normalized = domain.trim();
        if (normalized) values.add(normalized);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "cs"));
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const matchesHeaderFrom =
        headerFromFilter === "all" || (source.header_from_domains || []).includes(headerFromFilter);
      const matchesClassification =
        classificationFilter === "all" || source.classification === classificationFilter;
      return matchesHeaderFrom && matchesClassification;
    });
  }, [sources, headerFromFilter, classificationFilter]);

  const activeFilters = headerFromFilter !== "all" || classificationFilter !== DEFAULT_CLASSIFICATION_FILTER;

  function resetFilters() {
    setHeaderFromFilter("all");
    setClassificationFilter(DEFAULT_CLASSIFICATION_FILTER);
    setExpandedSource(null);
  }

  return (
    <section className="card panel full-width sources-card-home">
      <div className="section-header sources-header">
        <div className="section-title-block">
          <h2>Zdroje odesílání</h2>
          <p>Řádek je kombinace IP adresy a Header From domény. Jedna IP se může zobrazit vícekrát, pokud posílá pro více domén.</p>
        </div>

        <div className="source-filters" aria-label="Filtry zdrojů odesílání">
          <label className="filter-control">
            <span>Header From</span>
            <select value={headerFromFilter} onChange={(event) => setHeaderFromFilter(event.target.value)}>
              <option value="all">všechny domény</option>
              {headerFromOptions.map((domain) => (
                <option value={domain} key={domain}>{domain}</option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Stav zdroje</span>
            <select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)}>
              <option value="all">všechny stavy</option>
              {CLASSIFICATION_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="source-filter-summary" title={`Zobrazeno ${filteredSources.length} z ${sources.length} kombinací zdroj + doména`}>
            {filteredSources.length}/{sources.length}
          </div>

          <button className="filter-reset" type="button" onClick={resetFilters} disabled={!activeFilters}>
            Zrušit filtry
          </button>
        </div>
      </div>

      <div className="table-wrap sources-panel-home">
        <table className="table compact sources-table">
          <thead>
            <tr>
              <th>Zdroj</th><th>Header From</th><th>Provider</th><th>Objem</th><th>DMARC</th><th>SPF</th><th>DKIM</th><th>SPF domény</th><th>DKIM domény</th><th>Stav zdroje</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr><td colSpan={10}>Zatím nejsou data.</td></tr>
            ) : filteredSources.length === 0 ? (
              <tr><td colSpan={10}>Žádný zdroj neodpovídá vybraným filtrům.</td></tr>
            ) : filteredSources.map((source) => (
              <Fragment key={source.source_key}>
                <tr>
                  <td>
                    <button className="linklike source-main" onClick={() => setExpandedSource(expandedSource === source.source_key ? null : source.source_key)}>{source.source_ip}</button>
                    <small className="source-rdns">{source.reverse_dns || "bez reverse DNS"}</small>
                  </td>
                  <td><div className="domain-list" title={source.header_from}>{source.header_from || domains(source.header_from_domains)}</div></td>
                  <td className="provider-cell" title={source.provider_name || "Neznámý"}>{source.provider_name || "Neznámý"}</td>
                  <td className="nowrap">{formatNumber(source.total_count)}</td>
                  <td><span className={resultPill(source.dmarc)}>{resultLabel(source.dmarc)}</span><br /><small>{source.dmarc_pass_rate} %</small></td>
                  <td><span className={resultPill(source.spf)}>{resultLabel(source.spf)}</span><br /><small>{formatNumber(source.spf_policy_pass_count)} / {formatNumber(source.spf_policy_fail_count)}</small></td>
                  <td><span className={resultPill(source.dkim)}>{resultLabel(source.dkim)}</span><br /><small>{formatNumber(source.dkim_policy_pass_count)} / {formatNumber(source.dkim_policy_fail_count)}</small></td>
                  <td><div className="domain-list" title={source.spf_domains?.join(", ")}>{domains(source.spf_domains)}</div></td>
                  <td><div className="domain-list" title={source.dkim_domains?.join(", ")}>{domains(source.dkim_domains)}</div></td>
                  <td>
                    <select value={source.classification} onChange={(event) => onClassificationChange(source.source_id, source.source_ip, event.target.value)} disabled={loading} aria-label={`Stav zdroje ${source.source_ip} ${source.header_from || ""}`}>
                      {CLASSIFICATION_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                {expandedSource === source.source_key && (
                  <tr className="detail-row">
                    <td colSpan={10}>
                      <div className="source-detail-row">
                        <span><strong>DMARC:</strong> {formatNumber(source.dmarc_pass_count)} pass / {formatNumber(source.dmarc_fail_count)} fail</span>
                        <span><strong>SPF policy:</strong> {formatNumber(source.spf_policy_pass_count)} pass / {formatNumber(source.spf_policy_fail_count)} fail</span>
                        <span><strong>DKIM policy:</strong> {formatNumber(source.dkim_policy_pass_count)} pass / {formatNumber(source.dkim_policy_fail_count)} fail</span>
                        <span><strong>SPF auth:</strong> {formatNumber(source.spf_auth_pass_count)} pass / {formatNumber(source.spf_auth_fail_count)} fail</span>
                        <span><strong>DKIM auth:</strong> {formatNumber(source.dkim_auth_pass_count)} pass / {formatNumber(source.dkim_auth_fail_count)} fail</span>
                        <span><strong>Disposition:</strong> none {formatNumber(source.disposition_none_count)}, quarantine {formatNumber(source.disposition_quarantine_count)}, reject {formatNumber(source.disposition_reject_count)}</span>
                        <span><strong>Envelope From:</strong> {domains(source.envelope_from_domains)}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-help">Stav zdroje se teď ukládá pro konkrétní kombinaci domény a IP adresy. Stejná IP tedy může být pro jednu doménu známá a pro druhou podezřelá.</p>
    </section>
  );
}
