export type TimelineMode = "report" | "import";

export type SourceRow = {
  source_key: string;
  source_id: number | null;
  domain_id: number | null;
  source_ip: string;
  header_from: string;
  provider_name: string | null;
  reverse_dns: string | null;
  classification: string;
  notes: string | null;
  total_count: number;
  dmarc_pass_count: number;
  dmarc_fail_count: number;
  dmarc_pass_rate: number;
  spf_policy_pass_count: number;
  spf_policy_fail_count: number;
  spf_policy_pass_rate: number;
  dkim_policy_pass_count: number;
  dkim_policy_fail_count: number;
  dkim_policy_pass_rate: number;
  spf_auth_pass_count: number;
  spf_auth_fail_count: number;
  dkim_auth_pass_count: number;
  dkim_auth_fail_count: number;
  disposition_none_count: number;
  disposition_quarantine_count: number;
  disposition_reject_count: number;
  header_from_domains: string[];
  envelope_from_domains: string[];
  spf_domains: string[];
  dkim_domains: string[];
  dmarc: string;
  spf: string;
  dkim: string;
};

export type Dashboard = {
  timeline_mode: TimelineMode;
  total_messages: number;
  dmarc_pass_count: number;
  dmarc_fail_count: number;
  dmarc_pass_rate: number;
  unique_sources: number;
  unique_source_ips?: number;
  unknown_sources: number;
  reports_count: number;
  domains_count: number;
  first_report_date: string | null;
  last_report_date: string | null;
  first_import_date: string | null;
  last_import_date: string | null;
  top_sources: SourceRow[];
  timeline: Array<{ date: string; total: number; pass: number; fail: number }>;
};

export type ReportRow = {
  id: number;
  domain: string | null;
  org_name: string | null;
  report_id: string | null;
  date_begin: string | null;
  date_end: string | null;
  records: number;
  messages: number;
  created_at: string | null;
  source_filename: string | null;
};

export type Recommendation = {
  priority: string;
  source_ip: string;
  title: string;
  detail: string;
};

export const emptyDashboard: Dashboard = {
  timeline_mode: "report",
  total_messages: 0,
  dmarc_pass_count: 0,
  dmarc_fail_count: 0,
  dmarc_pass_rate: 0,
  unique_sources: 0,
  unknown_sources: 0,
  reports_count: 0,
  domains_count: 0,
  first_report_date: null,
  last_report_date: null,
  first_import_date: null,
  last_import_date: null,
  top_sources: [],
  timeline: []
};

export function formatNumber(value: number) {
  return new Intl.NumberFormat("cs-CZ").format(value || 0);
}

export function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export function percent(pass: number, total: number) {
  return total ? Math.round((pass / total) * 10000) / 100 : 0;
}

export function domains(values: string[]) {
  if (!values || values.length === 0) return "-";
  return values.slice(0, 3).join(", ") + (values.length > 3 ? ` +${values.length - 3}` : "");
}

export function classLabel(value: string) {
  return {
    known: "známý",
    unknown: "neznámý",
    suspicious: "podezřelý",
    ignored: "ignorovaný",
    needs_fix: "vyžaduje opravu"
  }[value] || value;
}

export function resultPill(value: string) {
  if (value === "pass") return "pill good";
  if (value === "fail") return "pill bad";
  if (value === "mixed") return "pill warn";
  return "pill";
}

export function resultLabel(value: string) {
  return { pass: "pass", fail: "fail", mixed: "mix", none: "-" }[value] || value;
}

export function priorityClass(value: string) {
  if (value === "critical") return "pill bad";
  if (value === "medium") return "pill warn";
  return "pill";
}
