from __future__ import annotations
from collections import defaultdict
from pathlib import Path
import hashlib, socket
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import Domain, ImportedFile, Report, ReportRecord, Source
from .parser import DmarcParseError, iter_xml_payloads, parse_dmarc_xml

VALID_CLASSIFICATIONS = {"known", "unknown", "suspicious", "ignored", "needs_fix"}

def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def _is_pass(value: str | None) -> bool:
    return (value or "").lower() == "pass"

def dmarc_pass(record: ReportRecord) -> bool:
    return _is_pass(record.dkim_policy_result) or _is_pass(record.spf_policy_result)

def _provider_from_rdns(reverse_dns: str | None) -> str | None:
    if not reverse_dns: return None
    value = reverse_dns.lower()
    mapping = {"google": "Google", "outlook": "Microsoft 365", "protection.outlook": "Microsoft 365", "amazonses": "Amazon SES", "sendgrid": "SendGrid", "mailchimp": "Mailchimp", "spf.protection": "Microsoft 365", "seznam": "Seznam"}
    for needle, provider in mapping.items():
        if needle in value: return provider
    return reverse_dns

def _reverse_dns(ip: str | None) -> tuple[str | None, str | None]:
    if not ip: return None, None
    try:
        rdns = socket.gethostbyaddr(ip)[0]
        return rdns, _provider_from_rdns(rdns)
    except Exception:
        return None, None

def _get_or_create_domain(db: Session, name: str | None, policy: str | None) -> Domain:
    domain_name = (name or "unknown.local").lower()
    domain = db.scalar(select(Domain).where(Domain.domain_name == domain_name))
    if domain:
        if policy and domain.dmarc_policy != policy: domain.dmarc_policy = policy
        return domain
    domain = Domain(domain_name=domain_name, dmarc_policy=policy)
    db.add(domain); db.flush(); return domain

def _get_or_create_source(db: Session, domain_id: int, source_ip: str | None) -> Source | None:
    if not source_ip: return None
    source = db.scalar(select(Source).where(Source.domain_id == domain_id, Source.source_ip == source_ip))
    if source: return source
    rdns, provider = _reverse_dns(source_ip)
    source = Source(domain_id=domain_id, source_ip=source_ip, reverse_dns=rdns, provider_name=provider, classification="unknown")
    db.add(source); db.flush(); return source

def process_report_file(db: Session, path: str | Path, original_filename: str | None = None) -> dict:
    file_path = Path(path)
    digest = sha256_file(file_path)
    imported = db.scalar(select(ImportedFile).where(ImportedFile.sha256 == digest))
    if imported and imported.status == "processed":
        return {"status": "duplicate", "sha256": digest, "message": "Soubor už byl dříve zpracován", "reports_created": imported.reports_created, "records_created": imported.records_created}
    if not imported:
        imported = ImportedFile(sha256=digest, original_filename=original_filename or file_path.name, stored_path=str(file_path), status="pending")
        db.add(imported); db.flush()
    reports_created = records_created = skipped_reports = 0
    try:
        for xml_name, xml_data in iter_xml_payloads(file_path):
            parsed = parse_dmarc_xml(xml_data)
            domain = _get_or_create_domain(db, parsed.policy_domain, parsed.policy_p)
            existing = db.scalar(select(Report).where(Report.org_name == parsed.org_name, Report.report_id == parsed.report_id, Report.date_begin == parsed.date_begin, Report.date_end == parsed.date_end))
            if existing:
                skipped_reports += 1; continue
            report = Report(domain_id=domain.id, org_name=parsed.org_name, report_id=parsed.report_id, date_begin=parsed.date_begin, date_end=parsed.date_end, raw_policy_domain=parsed.policy_domain, raw_policy_adkim=parsed.policy_adkim, raw_policy_aspf=parsed.policy_aspf, raw_policy_p=parsed.policy_p, raw_policy_sp=parsed.policy_sp, raw_policy_pct=parsed.policy_pct, source_filename=xml_name)
            db.add(report); db.flush(); reports_created += 1
            for item in parsed.records:
                _get_or_create_source(db, domain.id, item.source_ip)
                db.add(ReportRecord(report_id=report.id, source_ip=item.source_ip, count=item.count, disposition=item.disposition, dkim_policy_result=item.dkim_policy_result, spf_policy_result=item.spf_policy_result, header_from=item.header_from, envelope_from=item.envelope_from, dkim_domain=item.dkim_domain, dkim_result=item.dkim_result, spf_domain=item.spf_domain, spf_result=item.spf_result))
                records_created += 1
        imported.status = "processed"; imported.reports_created = reports_created; imported.records_created = records_created; imported.duplicate = reports_created == 0 and skipped_reports > 0
        imported.message = f"Hotovo. Reporty: {reports_created}, záznamy: {records_created}, přeskočeno: {skipped_reports}."
        db.commit()
        return {"status": "processed", "sha256": digest, "reports_created": reports_created, "records_created": records_created, "skipped_reports": skipped_reports, "message": imported.message}
    except DmarcParseError as exc:
        db.rollback(); _record_import_error(db, digest, original_filename or file_path.name, str(file_path), str(exc)); raise
    except Exception as exc:
        db.rollback(); _record_import_error(db, digest, original_filename or file_path.name, str(file_path), str(exc)); raise

def _record_import_error(db: Session, digest: str, filename: str, stored_path: str, message: str) -> None:
    item = db.scalar(select(ImportedFile).where(ImportedFile.sha256 == digest))
    if not item:
        item = ImportedFile(sha256=digest, original_filename=filename, stored_path=stored_path)
        db.add(item)
    item.status = "error"; item.message = message; db.commit()

def _empty_source_row(source_ip: str, source: Source | None = None, header_from: str | None = None, domain_id: int | None = None) -> dict:
    clean_header_from = (header_from or "bez-header-from").lower()
    source_id = source.id if source else None
    source_key = f"{source_ip}|{clean_header_from}|{domain_id or 'no-domain'}"
    return {
        "source_key": source_key,
        "source_id": source_id,
        "domain_id": domain_id,
        "source_ip": source_ip,
        "header_from": clean_header_from,
        "provider_name": source.provider_name if source else None,
        "reverse_dns": source.reverse_dns if source else None,
        "classification": source.classification if source else "unknown",
        "notes": source.notes if source else None,
        "total_count": 0,
        "dmarc_pass_count": 0,
        "dmarc_fail_count": 0,
        "spf_policy_pass_count": 0,
        "spf_policy_fail_count": 0,
        "dkim_policy_pass_count": 0,
        "dkim_policy_fail_count": 0,
        "spf_auth_pass_count": 0,
        "spf_auth_fail_count": 0,
        "dkim_auth_pass_count": 0,
        "dkim_auth_fail_count": 0,
        "disposition_none_count": 0,
        "disposition_quarantine_count": 0,
        "disposition_reject_count": 0,
        "header_from_domains": set([clean_header_from] if clean_header_from != "bez-header-from" else []),
        "envelope_from_domains": set(),
        "spf_domains": set(),
        "dkim_domains": set(),
    }


def _result_label(pass_count: int, fail_count: int, total: int) -> str:
    if not total:
        return "none"
    if pass_count > 0 and fail_count == 0:
        return "pass"
    if fail_count > 0 and pass_count == 0:
        return "fail"
    return "mixed"


def _finalize_source_row(row: dict) -> dict:
    total = row["total_count"] or 0
    for key in ["dmarc_pass", "spf_policy_pass", "dkim_policy_pass", "spf_auth_pass", "dkim_auth_pass"]:
        count_key = f"{key}_count"
        row[f"{key}_rate"] = round((row[count_key] / total) * 100, 2) if total else 0
    for key in ["header_from_domains", "envelope_from_domains", "spf_domains", "dkim_domains"]:
        row[key] = sorted(value for value in row[key] if value)[:10]
    row["dmarc"] = _result_label(row["dmarc_pass_count"], row["dmarc_fail_count"], total)
    row["spf"] = _result_label(row["spf_policy_pass_count"], row["spf_policy_fail_count"], total)
    row["dkim"] = _result_label(row["dkim_policy_pass_count"], row["dkim_policy_fail_count"], total)
    return row


def _source_indexes(db: Session) -> tuple[dict[tuple[int, str], Source], dict[str, Source]]:
    sources = db.scalars(select(Source)).all()
    by_domain_ip: dict[tuple[int, str], Source] = {}
    by_ip: dict[str, Source] = {}
    for source in sources:
        by_domain_ip[(source.domain_id, source.source_ip)] = source
        by_ip.setdefault(source.source_ip, source)
    return by_domain_ip, by_ip


def list_sources(db: Session) -> list[dict]:
    """Return sources aggregated by source IP and Header From domain.

    One SMTP source can send mail for multiple domains. In the UI that must be
    visible as separate rows, for example:
      90.182.34.60 + ekostavbylouny.cz
      90.182.34.60 + es-reality.cz
    """
    records = db.scalars(select(ReportRecord)).all()
    reports = {report.id: report for report in db.scalars(select(Report)).all()}
    sources_by_domain_ip, sources_by_ip = _source_indexes(db)
    aggregate: dict[str, dict] = {}

    for record in records:
        ip = record.source_ip or "unknown"
        report = reports.get(record.report_id)
        domain_id = report.domain_id if report else None
        header_from = (record.header_from or (report.raw_policy_domain if report else None) or "bez-header-from").lower()
        source = sources_by_domain_ip.get((domain_id, ip)) if domain_id is not None else None
        if source is None:
            source = sources_by_ip.get(ip)
        key = f"{ip}|{header_from}|{domain_id or 'no-domain'}"
        if key not in aggregate:
            aggregate[key] = _empty_source_row(ip, source, header_from, domain_id)
        row = aggregate[key]
        count = record.count or 0
        row["total_count"] += count

        if dmarc_pass(record): row["dmarc_pass_count"] += count
        else: row["dmarc_fail_count"] += count
        if _is_pass(record.spf_policy_result): row["spf_policy_pass_count"] += count
        else: row["spf_policy_fail_count"] += count
        if _is_pass(record.dkim_policy_result): row["dkim_policy_pass_count"] += count
        else: row["dkim_policy_fail_count"] += count
        if _is_pass(record.spf_result): row["spf_auth_pass_count"] += count
        else: row["spf_auth_fail_count"] += count
        if _is_pass(record.dkim_result): row["dkim_auth_pass_count"] += count
        else: row["dkim_auth_fail_count"] += count

        disposition = (record.disposition or "none").lower()
        if disposition == "quarantine": row["disposition_quarantine_count"] += count
        elif disposition == "reject": row["disposition_reject_count"] += count
        else: row["disposition_none_count"] += count

        row["header_from_domains"].add(header_from if header_from != "bez-header-from" else None)
        row["envelope_from_domains"].add(record.envelope_from)
        row["spf_domains"].add(record.spf_domain)
        row["dkim_domains"].add(record.dkim_domain)

    return sorted([_finalize_source_row(row) for row in aggregate.values()], key=lambda x: (x["source_ip"], x["header_from"], -x["total_count"]))


def dashboard(db: Session, timeline_mode: str = "report") -> dict:
    records = db.scalars(select(ReportRecord)).all(); reports = db.scalars(select(Report)).all(); report_by_id = {r.id: r for r in reports}
    source_rows = list_sources(db)
    total = sum(r.count or 0 for r in records); passed = sum(r.count or 0 for r in records if dmarc_pass(r)); failed = max(total - passed, 0)
    timeline_map: dict[str, dict] = defaultdict(lambda: {"date": "", "total": 0, "pass": 0, "fail": 0})
    for record in records:
        report = report_by_id.get(record.report_id); dt = report.created_at if timeline_mode == "import" and report else report.date_begin if report else None
        label = dt.date().isoformat() if dt else "bez-data"
        timeline_map[label]["date"] = label; timeline_map[label]["total"] += record.count or 0
        if dmarc_pass(record): timeline_map[label]["pass"] += record.count or 0
        else: timeline_map[label]["fail"] += record.count or 0
    report_dates = [r.date_begin for r in reports if r.date_begin]; import_dates = [r.created_at for r in reports if r.created_at]
    return {
        "timeline_mode": timeline_mode,
        "total_messages": total,
        "dmarc_pass_count": passed,
        "dmarc_fail_count": failed,
        "dmarc_pass_rate": round((passed / total) * 100, 2) if total else 0,
        "unique_sources": len(source_rows),
        "unique_source_ips": len({row["source_ip"] for row in source_rows}),
        "unknown_sources": sum(1 for row in source_rows if row.get("classification") in {"unknown", "suspicious", "needs_fix"}),
        "reports_count": db.scalar(select(func.count(Report.id))) or 0,
        "domains_count": db.scalar(select(func.count(Domain.id))) or 0,
        "first_report_date": min(report_dates).isoformat() if report_dates else None,
        "last_report_date": max(report_dates).isoformat() if report_dates else None,
        "first_import_date": min(import_dates).isoformat() if import_dates else None,
        "last_import_date": max(import_dates).isoformat() if import_dates else None,
        "top_sources": sorted(source_rows, key=lambda x: x["total_count"], reverse=True)[:10],
        "timeline": sorted(timeline_map.values(), key=lambda x: x["date"], reverse=True),
    }


def update_source_classification(db: Session, source_ip: str, classification: str, notes: str | None = None) -> dict:
    """Backward compatible IP-only update. Prefer update_source_classification_by_id."""
    if classification not in VALID_CLASSIFICATIONS: raise ValueError(f"Neplatná klasifikace: {classification}")
    source = db.scalar(select(Source).where(Source.source_ip == source_ip))
    if not source: raise ValueError("Zdroj nebyl nalezen")
    source.classification = classification
    if notes is not None: source.notes = notes
    db.commit(); return {"source_id": source.id, "source_ip": source.source_ip, "classification": source.classification, "notes": source.notes}


def update_source_classification_by_id(db: Session, source_id: int, classification: str, notes: str | None = None) -> dict:
    if classification not in VALID_CLASSIFICATIONS: raise ValueError(f"Neplatná klasifikace: {classification}")
    source = db.get(Source, source_id)
    if not source: raise ValueError("Zdroj nebyl nalezen")
    source.classification = classification
    if notes is not None: source.notes = notes
    db.commit(); return {"source_id": source.id, "source_ip": source.source_ip, "classification": source.classification, "notes": source.notes}


def list_reports(db: Session) -> list[dict]:
    result = []
    for report in db.scalars(select(Report).order_by(Report.created_at.desc(), Report.date_begin.desc(), Report.date_end.desc())).all():
        record_count = db.scalar(select(func.count(ReportRecord.id)).where(ReportRecord.report_id == report.id)) or 0
        message_count = db.scalar(select(func.coalesce(func.sum(ReportRecord.count), 0)).where(ReportRecord.report_id == report.id)) or 0
        result.append({"id": report.id, "domain": report.raw_policy_domain, "org_name": report.org_name, "report_id": report.report_id, "date_begin": report.date_begin.isoformat() if report.date_begin else None, "date_end": report.date_end.isoformat() if report.date_end else None, "records": record_count, "messages": int(message_count or 0), "created_at": report.created_at.isoformat() if report.created_at else None, "source_filename": report.source_filename})
    return result


def source_detail(db: Session, source_ip: str) -> dict:
    rows = [row for row in list_sources(db) if row["source_ip"] == source_ip]
    if not rows: raise ValueError("Zdroj nebyl nalezen")
    records = db.scalars(select(ReportRecord).where(ReportRecord.source_ip == source_ip).order_by(ReportRecord.created_at.desc())).all()
    rows[0]["records"] = [{"count": r.count, "disposition": r.disposition, "dkim_policy_result": r.dkim_policy_result, "spf_policy_result": r.spf_policy_result, "header_from": r.header_from, "envelope_from": r.envelope_from, "dkim_domain": r.dkim_domain, "dkim_result": r.dkim_result, "spf_domain": r.spf_domain, "spf_result": r.spf_result, "created_at": r.created_at.isoformat() if r.created_at else None} for r in records[:100]]
    return rows[0]


def recommendations(db: Session) -> list[dict]:
    out = []
    for item in list_sources(db):
        total = item.get("total_count", 0); fail = item.get("dmarc_fail_count", 0); cls = item.get("classification", "unknown"); ip = item.get("source_ip"); header_from = item.get("header_from") or ", ".join(item.get("header_from_domains", [])); provider = item.get("provider_name") or "Neznámý provider"
        label = f"{ip} / {header_from}" if header_from else ip
        if not total: continue
        if cls == "known" and fail > 0:
            out.append({"priority": "critical" if fail >= 100 else "medium", "source_ip": label, "title": "Známý zdroj má DMARC fail", "detail": f"Zdroj {label} ({provider}) má {fail} selhaných zpráv. Ověřte SPF include, DKIM podpis a alignment."})
        elif cls in {"unknown", "suspicious"} and fail > 0:
            out.append({"priority": "critical" if fail >= 100 else "low", "source_ip": label, "title": "Neznámý zdroj selhává", "detail": f"Zdroj {label} má {fail} DMARC fail zpráv. Pokud není legitimní, jde pravděpodobně o spoofing."})
        elif cls == "unknown" and item.get("dmarc_pass_rate", 0) > 95:
            out.append({"priority": "medium", "source_ip": label, "title": "Neznámý zdroj úspěšně prochází", "detail": f"Zdroj {label} posílá úspěšně. Ověřte, zda je legitimní pro tuto doménu, a případně ho označte jako známý."})
        elif item.get("spf_policy_fail_count", 0) > 0 and item.get("dkim_policy_fail_count", 0) == 0:
            out.append({"priority": "medium", "source_ip": label, "title": "SPF selhává, DKIM drží DMARC", "detail": f"Zdroj {label} má SPF fail, ale DKIM prochází. Ověřte SPF include nebo Envelope From alignment."})
        elif item.get("dkim_policy_fail_count", 0) > 0 and item.get("spf_policy_fail_count", 0) == 0:
            out.append({"priority": "medium", "source_ip": label, "title": "DKIM selhává, SPF drží DMARC", "detail": f"Zdroj {label} má DKIM fail, ale SPF prochází. Ověřte DKIM selector, signing doménu a alignment."})
    return sorted(out, key=lambda x: {"critical":0,"medium":1,"low":2}.get(x["priority"], 9))

