from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import gzip
import io
import zipfile

from defusedxml import ElementTree as ET


@dataclass
class ParsedRecord:
    source_ip: str | None
    count: int
    disposition: str | None
    dkim_policy_result: str | None
    spf_policy_result: str | None
    header_from: str | None
    envelope_from: str | None
    dkim_domain: str | None
    dkim_result: str | None
    spf_domain: str | None
    spf_result: str | None


@dataclass
class ParsedReport:
    org_name: str | None
    report_id: str | None
    date_begin: datetime | None
    date_end: datetime | None
    policy_domain: str | None
    policy_adkim: str | None
    policy_aspf: str | None
    policy_p: str | None
    policy_sp: str | None
    policy_pct: str | None
    records: list[ParsedRecord]


class DmarcParseError(Exception):
    pass


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _child(element, name: str):
    if element is None:
        return None

    for item in list(element):
        if _local_name(item.tag) == name:
            return item

    return None


def _children_named(element, name: str):
    if element is None:
        return []

    return [item for item in list(element) if _local_name(item.tag) == name]


def _text(element, *path: str) -> str | None:
    current = element

    for name in path:
        current = _child(current, name)
        if current is None:
            return None

    if current.text is None:
        return None

    value = current.text.strip()
    return value or None


def _unix_to_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc).replace(tzinfo=None)
    except Exception:
        return None


def _int(value: str | None, default: int = 0) -> int:
    try:
        return int(value or default)
    except Exception:
        return default


def _is_gzip(data: bytes) -> bool:
    return data.startswith(b"\x1f\x8b")


def _decompress_gzip(data: bytes, name: str) -> bytes:
    try:
        return gzip.GzipFile(fileobj=io.BytesIO(data)).read()
    except Exception as exc:
        raise DmarcParseError(f"GZIP nejde rozbalit: {name}: {exc}") from exc


def _looks_like_xml(data: bytes) -> bool:
    head = data[:512].lstrip(b"\xef\xbb\xbf\t\r\n ")
    return head.startswith(b"<") and (b"feedback" in head[:256] or b"<?xml" in head[:64])


def _append_payload_if_dmarc(payloads: list[tuple[str, bytes]], name: str, data: bytes) -> None:
    lower = name.lower()

    if lower.endswith(".gz") or _is_gzip(data):
        data = _decompress_gzip(data, name)
        if lower.endswith(".gz"):
            name = Path(name).name.removesuffix(".gz")
    else:
        name = Path(name).name

    if lower.endswith((".xml", ".xml.gz", ".gz")) or _looks_like_xml(data):
        payloads.append((name or "report.xml", data))


def iter_xml_payloads(path: Path) -> list[tuple[str, bytes]]:
    suffix = path.name.lower()
    payloads: list[tuple[str, bytes]] = []

    if suffix.endswith(".xml"):
        payloads.append((path.name, path.read_bytes()))

    elif suffix.endswith(".gz"):
        with gzip.open(path, "rb") as handle:
            payloads.append((path.name.removesuffix(".gz"), handle.read()))

    elif suffix.endswith(".zip"):
        with zipfile.ZipFile(path) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue

                if info.file_size > 50 * 1024 * 1024:
                    raise DmarcParseError(f"Soubor v ZIPu je příliš velký: {info.filename}")

                data = zf.read(info)
                _append_payload_if_dmarc(payloads, info.filename, data)

    else:
        raise DmarcParseError("Podporované jsou pouze soubory .xml, .zip a .gz")

    if not payloads:
        raise DmarcParseError("V souboru nebyl nalezen žádný XML DMARC report")

    return payloads


def parse_dmarc_xml(data: bytes) -> ParsedReport:
    try:
        root = ET.fromstring(data)
    except Exception as exc:
        raise DmarcParseError(f"XML nejde naparsovat: {exc}") from exc

    if _local_name(root.tag) != "feedback":
        raise DmarcParseError("XML nevypadá jako DMARC aggregate report, chybí kořen feedback")

    metadata = _child(root, "report_metadata")
    policy = _child(root, "policy_published")
    date_range = _child(metadata, "date_range") if metadata is not None else None

    records: list[ParsedRecord] = []

    for record in _children_named(root, "record"):
        row = _child(record, "row")
        policy_eval = _child(row, "policy_evaluated") if row is not None else None
        identifiers = _child(record, "identifiers")
        auth_results = _child(record, "auth_results")
        dkim = _child(auth_results, "dkim") if auth_results is not None else None
        spf = _child(auth_results, "spf") if auth_results is not None else None

        records.append(
            ParsedRecord(
                source_ip=_text(row, "source_ip"),
                count=_int(_text(row, "count")),
                disposition=_text(policy_eval, "disposition"),
                dkim_policy_result=_text(policy_eval, "dkim"),
                spf_policy_result=_text(policy_eval, "spf"),
                header_from=_text(identifiers, "header_from"),
                envelope_from=_text(identifiers, "envelope_from"),
                dkim_domain=_text(dkim, "domain"),
                dkim_result=_text(dkim, "result"),
                spf_domain=_text(spf, "domain"),
                spf_result=_text(spf, "result"),
            )
        )

    return ParsedReport(
        org_name=_text(metadata, "org_name"),
        report_id=_text(metadata, "report_id"),
        date_begin=_unix_to_datetime(_text(date_range, "begin")),
        date_end=_unix_to_datetime(_text(date_range, "end")),
        policy_domain=_text(policy, "domain"),
        policy_adkim=_text(policy, "adkim"),
        policy_aspf=_text(policy, "aspf"),
        policy_p=_text(policy, "p"),
        policy_sp=_text(policy, "sp"),
        policy_pct=_text(policy, "pct"),
        records=records,
    )
